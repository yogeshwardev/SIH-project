const API_BASE = '/api';

export const api = {
  // 1. Image AI Enhancement
  async enhanceImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/products/image-enhance`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to enhance image' }));
      throw new Error(err.detail || 'Image enhancement failed');
    }
    return res.json();
  },

  // 2. Speech-to-Text Transcription
  async transcribeAudio(file, languageHint = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (languageHint) {
      formData.append('language_hint', languageHint);
    }
    const res = await fetch(`${API_BASE}/speech/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Speech transcription failed' }));
      throw new Error(err.detail || 'Transcription failed');
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
      const err = await res.json().catch(() => ({ detail: 'Entity extraction failed' }));
      throw new Error(err.detail || 'Extraction failed');
    }
    return res.json();
  },

  // 4. Multilingual Listing Generation
  async generateListing(attributes, artisanName = 'Master Artisan') {
    const res = await fetch(`${API_BASE}/products/generate-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes,
        artisan_name: artisanName,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Listing generation failed' }));
      throw new Error(err.detail || 'Listing generation failed');
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
      const err = await res.json().catch(() => ({ detail: 'Pricing calculation failed' }));
      throw new Error(err.detail || 'Pricing failed');
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
      const err = await res.json().catch(() => ({ detail: 'Product submission failed' }));
      throw new Error(err.detail || 'Failed to submit product');
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
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  // 10. Delete Product
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
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
    if (!res.ok) throw new Error('Failed to approve product');
    return res.json();
  },

  async rejectProduct(id, reason = 'Needs further craft clarification') {
    const res = await fetch(`${API_BASE}/admin/reject/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: reason }),
    });
    if (!res.ok) throw new Error('Failed to reject product');
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

  // Dashboard Analytics
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  // Export URLs
  csvExportUrl: `${API_BASE}/catalog/export/csv`,
  jsonExportUrl: `${API_BASE}/catalog/export/json`,
};
