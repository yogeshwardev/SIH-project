import sys
from pathlib import Path

# Add workspace root to sys.path
BASE_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BASE_DIR))

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.ml.pricing_model import pricing_ml_model

def run_training():
    print("==================================================")
    print("CraftLink AI: Training Craft Pricing ML Model...")
    print("==================================================")
    metrics = pricing_ml_model.train_on_reference_data()
    print(f"Training Complete! Trained on {metrics['samples']} benchmark craft samples.")
    print(f"Mean Absolute Error (MAE): Rs. {metrics['mae']:.2f}")
    print(f"Root Mean Squared Error (RMSE): Rs. {metrics['rmse']:.2f}")
    print(f"R^2 Score: {metrics['r2']:.4f}")
    print(f"Model saved to {pricing_ml_model.model_path}")
    print("==================================================")

if __name__ == "__main__":
    run_training()
