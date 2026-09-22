const API_BASE = '/api';

// FastAPI returns `detail` as a string, or as a list of validation errors.
async function errorMessage(res, fallback) {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
      return field ? `${String(field).replace(/_/g, ' ')}: ${item.msg}` : item.msg;
    }).join(' · ');
  }
  return fallback;
}

export const api = {
  // ==========================================
  // Authentication & User Accounts API
  // ==========================================
  async login(payload) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Login failed'));
    }
    return res.json();
  },

  async registerBuyer(payload) {
    const res = await fetch(`${API_BASE}/auth/buyer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Registration failed'));
    }
    return res.json();
  },

  async registerSeller(payload) {
    const res = await fetch(`${API_BASE}/auth/seller/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Seller registration failed'));
    }
    return res.json();
  },

  async adminLogin(payload) {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Admin login failed'));
    }
    return res.json();
  },

  // 1. Image AI Enhancement
  async enhanceImage(file, backgroundStyle = 'warm-studio', customBackground = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('background_style', backgroundStyle);
    if (customBackground) formData.append('custom_background', customBackground);
    const res = await fetch(`${API_BASE}/products/image-enhance`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Image enhancement failed'));
    }
    return res.json();
  },

  async changeImageBackground(originalImageUrl, backgroundStyle, customBackground = null) {
    const formData = new FormData();
    formData.append('original_image_url', originalImageUrl);
    formData.append('background_style', backgroundStyle);
    if (customBackground) formData.append('custom_background', customBackground);
    const res = await fetch(`${API_BASE}/products/image-rebackground`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not change the image background'));
    return res.json();
  },

  // 2. Speech-to-Text Transcription
  async transcribeAudio(file, languageHint = null, filename = 'artisan_speech.webm') {
    const formData = new FormData();
    formData.append('file', file, filename);
    if (languageHint) {
      formData.append('language_hint', languageHint);
    }
    const res = await fetch(`${API_BASE}/speech/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Transcription failed'));
    }
    return res.json();
  },

  async continueProductInterview(payload) {
    const res = await fetch(`${API_BASE}/speech/product-interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Product interview failed'));
    }
    return res.json();
  },

  // 3. Product Intelligence Extraction (NLP)
  async extractProductInfo(transcript, detectedObjects = [], language = 'Hindi') {
    const res = await fetch(`${API_BASE}/products/extract-information`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        detected_objects: detectedObjects,
        language,
      }),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Extraction failed'));
    }
    return res.json();
  },

  // 4. Multilingual Listing Generation
  async generateListing(attributes, artisanName = 'Master Artisan', sourceLanguage = 'English') {
    const res = await fetch(`${API_BASE}/products/generate-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes,
        artisan_name: artisanName,
        // The language the artisan spoke in, so their words are translated
        // rather than quoted in a script the buyer cannot read.
        source_language: sourceLanguage,
      }),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Listing generation failed'));
    }
    return res.json();
  },

  // 5. Smart Price Recommendation
  async calculatePrice(pricingData) {
    const res = await fetch(`${API_BASE}/products/price-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pricingData),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Pricing failed'));
    }
    return res.json();
  },

  // 6. Product Creation / Request for Admin Approval
  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, 'Failed to submit product'));
    }
    return res.json();
  },

  // 7. Get Products (Consumer Store & Catalog)
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.craft_type && params.craft_type !== 'All') query.append('craft_type', params.craft_type);
    if (params.region && params.region !== 'All') query.append('region', params.region);
    if (params.status) query.append('status', params.status);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.artisan_id) query.append('artisan_id', params.artisan_id);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // 8. Get Product By ID
  async getProductById(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  // 9. Update Product
  async updateProduct(id, updateData) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Failed to update product'));
    return res.json();
  },

  // 10. Delete Product
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Failed to delete product'));
    return res.json();
  },

  // ==========================================
  // Admin Governance & Approval Queue API
  // ==========================================
  async getPendingProducts() {
    const res = await fetch(`${API_BASE}/admin/pending-products`);
    if (!res.ok) throw new Error('Failed to fetch pending approval products');
    return res.json();
  },

  async approveProduct(id, adminNotes = 'Approved for Marketplace publication') {
    const res = await fetch(`${API_BASE}/admin/approve/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Failed to approve product'));
    return res.json();
  },

  async rejectProduct(id, reason = 'Needs further craft clarification') {
    const res = await fetch(`${API_BASE}/admin/reject/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: reason }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Failed to reject product'));
    return res.json();
  },

  async autoApproveAll() {
    const res = await fetch(`${API_BASE}/admin/auto-approve-all`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to auto-approve products');
    return res.json();
  },

  // ==========================================
  // Buyer Orders & Inquiries API
  // ==========================================
  async createInquiry(inquiryData) {
    const res = await fetch(`${API_BASE}/inquiries/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData),
    });
    if (!res.ok) throw new Error('Failed to submit order inquiry');
    return res.json();
  },

  async getInquiries() {
    const res = await fetch(`${API_BASE}/inquiries`);
    if (!res.ok) throw new Error('Failed to fetch orders/inquiries');
    return res.json();
  },

  async updateInquiryStatus(id, newStatus) {
    const res = await fetch(`${API_BASE}/inquiries/${id}/status?new_status=${newStatus}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update inquiry status');
    return res.json();
  },

  // Real seller profiles and fulfillment orders
  async getArtisans() {
    const res = await fetch(`${API_BASE}/artisans`);
    if (!res.ok) throw new Error('Failed to load artisan profiles');
    return res.json();
  },

  async getArtisan(id) {
    const res = await fetch(`${API_BASE}/artisans/${id}`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Seller profile not found'));
    return res.json();
  },

  async createArtisan(payload) {
    const res = await fetch(`${API_BASE}/artisans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to register artisan store');
    return res.json();
  },

  async verifyArtisanKyc(id, status = 'Verified') {
    const res = await fetch(`${API_BASE}/artisans/${id}/verify?kyc_status=${status}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to verify artisan profile');
    return res.json();
  },

  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.artisan_id) query.set('artisan_id', params.artisan_id);
    const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load fulfilment orders');
    return res.json();
  },

  async checkout(payload) {
    const res = await fetch(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'We could not place your order. Please try again.'));
    return res.json();
  },

  async trackOrder(orderNumber, email) {
    const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(orderNumber.trim().toUpperCase())}?email=${encodeURIComponent(email.trim())}`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Order not found for that email address.'));
    return res.json();
  },

  async updateOrderStatus(orderNumber, status) {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not update the order status.'));
    return res.json();
  },

  // Dashboard Analytics
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  // B2B market linkage: a buyer asks for a quantity, the artisan answers with a
  // price and a lead time, the buyer accepts or declines.
  async createBulkRequest(payload) {
    const res = await fetch(`${API_BASE}/bulk-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not send your enquiry. Please try again.'));
    return res.json();
  },

  async getBulkRequests(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ).toString();
    const res = await fetch(`${API_BASE}/bulk-requests${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not load bulk enquiries.'));
    return res.json();
  },

  async quoteBulkRequest(reference, payload) {
    const res = await fetch(`${API_BASE}/bulk-requests/${encodeURIComponent(reference)}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not send your price.'));
    return res.json();
  },

  async decideBulkRequest(reference, payload) {
    const res = await fetch(`${API_BASE}/bulk-requests/${encodeURIComponent(reference)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not record your decision.'));
    return res.json();
  },

  // Scheme-level impact, counted from live records only.
  async getImpactSummary() {
    const res = await fetch(`${API_BASE}/impact/summary`);
    if (!res.ok) throw new Error(await errorMessage(res, 'Could not load impact data.'));
    return res.json();
  },

  // Export URLs
  csvExportUrl: `${API_BASE}/catalog/export/csv`,
  jsonExportUrl: `${API_BASE}/catalog/export/json`,
  ondcExportUrl: `${API_BASE}/catalog/export/ondc.json`,
  gemExportUrl: `${API_BASE}/catalog/export/gem.csv`,
};
