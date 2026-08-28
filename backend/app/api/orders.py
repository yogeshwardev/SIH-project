import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from backend.app.database.database import get_db
from backend.app.models.order import Order, OrderItem
from backend.app.models.product import Product
from backend.app.schemas.order import CheckoutCreate, OrderItemResponse, OrderResponse, OrderStatusUpdate


router = APIRouter(prefix="/orders", tags=["Orders"])


def _order_number() -> str:
    stamp = datetime.utcnow().strftime("%y%m%d")
    return f"CL-{stamp}-{secrets.token_hex(3).upper()}"


def _format_order(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        buyer_name=order.buyer_name,
        buyer_email=order.buyer_email,
        buyer_phone=order.buyer_phone,
        address_line1=order.address_line1,
        address_line2=order.address_line2,
        city=order.city,
        state=order.state,
        postal_code=order.postal_code,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        status=order.status,
        subtotal=order.subtotal,
        shipping_amount=order.shipping_amount,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        items=[
            OrderItemResponse(
                product_id=item.product_id,
                artisan_id=item.artisan_id,
                product_name=item.product_name,
                product_image=item.product_image,
                unit_price=item.unit_price,
                quantity=item.quantity,
                line_total=item.line_total,
            )
            for item in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(payload: CheckoutCreate, db: Session = Depends(get_db)):
    requested = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    products = (
        db.query(Product)
        .filter(Product.id.in_(requested.keys()))
        .with_for_update()
        .all()
    )
    by_id = {product.id: product for product in products}
    if len(by_id) != len(requested):
        missing = sorted(set(requested) - set(by_id))
        raise HTTPException(status_code=404, detail=f"Products not found: {missing}")

    subtotal = 0.0
    for product_id, quantity in requested.items():
        product = by_id[product_id]
        if product.status != "Published":
            raise HTTPException(status_code=409, detail=f"{product.product_name} is not available for sale.")
        if product.suggested_price <= 0:
            raise HTTPException(status_code=409, detail=f"{product.product_name} does not have a valid selling price.")
        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Only {product.stock_quantity} unit(s) of {product.product_name} are available.",
            )
        subtotal += float(product.suggested_price) * quantity

    order = Order(
        order_number=_order_number(),
        buyer_name=payload.buyer_name,
        buyer_email=str(payload.buyer_email).lower(),
        buyer_phone=payload.buyer_phone,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        payment_method=payload.payment_method,
        payment_status="Pending on delivery",
        status="Placed",
        subtotal=round(subtotal, 2),
        shipping_amount=0.0,
        tax_amount=0.0,
        total_amount=round(subtotal, 2),
    )
    db.add(order)
    db.flush()

    for product_id, quantity in requested.items():
        product = by_id[product_id]
        unit_price = float(product.suggested_price)
        product.stock_quantity -= quantity
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            artisan_id=product.artisan_id,
            product_name=product.product_name,
            product_image=product.enhanced_image or product.original_image,
            unit_price=unit_price,
            quantity=quantity,
            line_total=round(unit_price * quantity, 2),
        ))

    db.commit()
    created = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order.id)
        .first()
    )
    return _format_order(created)


@router.get("", response_model=List[OrderResponse])
def list_orders(
    artisan_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(joinedload(Order.items))
    if artisan_id is not None:
        query = query.join(Order.items).filter(OrderItem.artisan_id == artisan_id).distinct()
    orders = query.order_by(Order.created_at.desc()).all()
    return [_format_order(order) for order in orders]


@router.get("/track/{order_number}", response_model=OrderResponse)
def track_order(order_number: str, email: str = Query(...), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.order_number == order_number, Order.buyer_email == email.strip().lower())
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for that email address.")
    return _format_order(order)


@router.put("/{order_number}/status", response_model=OrderResponse)
def update_order_status(order_number: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    transitions = {
        "Placed": {"Confirmed", "Cancelled"},
        "Confirmed": {"Packed", "Cancelled"},
        "Packed": {"Shipped"},
        "Shipped": {"Delivered"},
        "Delivered": set(),
        "Cancelled": set(),
    }
    if payload.status not in transitions.get(order.status, set()):
        raise HTTPException(status_code=409, detail=f"Cannot move order from {order.status} to {payload.status}.")

    if payload.status == "Cancelled":
        for item in order.items:
            if item.product:
                item.product.stock_quantity += item.quantity
    if payload.status == "Delivered" and order.payment_method == "cod":
        order.payment_status = "Paid"
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _format_order(order)

