# Business storefront photography

Banner and category images are illustrative merchandising photography. They are not sale listing photos, product certification, proof of origin, or named artisan testimonials. Product cards, details, and cart images only use media stored on each product record, with an enhanced → original → gallery fallback. The storefront now reads published backend listings without merging the hard-coded commercial sample catalog.

Assets are stored locally in `frontend/public/images/storefront/` so the rendered storefront does not need third-party image requests. The download script is `frontend/scripts/download-storefront-assets.mjs`.

| Local file | Source |
| --- | --- |
| ceramics-hero-v2.jpg | Existing project Unsplash photograph: https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261 |
| textiles-v2.jpg | Tim Mossholder: https://www.pexels.com/photo/close-up-photo-of-assorted-colored-fabrics-11604961/ |
| pottery-v2.jpg | Gourav Chandel: https://www.pexels.com/photo/top-view-of-clay-pots-and-potter-s-wheel-10923157/ |
| woodcraft-v2.jpg | Cup of Couple: https://www.pexels.com/photo/wooden-spoons-on-wooden-surface-6962802/ |
| metalcraft-v2.jpg | gökçe erem: https://www.pexels.com/photo/brass-and-bronze-objects-in-a-market-14724142/ |
| basket-v2.jpg | Mine Demirkurt: https://www.pexels.com/photo/woven-basket-in-the-warm-glow-of-sunset-29315525/ |
| painting-v2.jpg | Pexels photo 102127: https://www.pexels.com/photo/102127/ |
| artisan-v2.jpg | Mochammad Algi: https://www.pexels.com/photo/potter-and-clay-2892269/ |

License sources checked September 13, 2026: [Unsplash License](https://unsplash.com/license) and [Pexels License](https://www.pexels.com/license/). No image is sold separately or used as a product endorsement. Stock photo usage must remain illustrative when adding new merchant pages.

Original AI campaign imagery was attempted using the built-in image tool, but generation was unavailable because the account image quota was reached. No AI-generated asset was substituted for real product media. No paid CLI/API generation was used.

## Sample catalog photography

The sample catalog (`python -m backend.scripts.seed_catalog`) uses Pexels photographs under the [Pexels License](https://www.pexels.com/license/). They illustrate sample listings for demos; the stores and people in the sample data are fictional. Run `python -m backend.scripts.seed_catalog --remove` before real sellers go live.

| Local file | Pexels source |
| --- | --- |
| uploads/catalog/kanchipuram-silk-saree.jpg | https://www.pexels.com/photo/10317127/ |
| uploads/catalog/sanganer-mandala-table-cover.jpg | https://www.pexels.com/photo/8751695/ |
| uploads/catalog/kullu-wool-stole.jpg | https://www.pexels.com/photo/35170069/ |
| uploads/catalog/kutch-elephant-table-runner.jpg | https://www.pexels.com/photo/37975931/ |
| uploads/catalog/madhubani-tussar-dupatta.jpg | https://www.pexels.com/photo/165891/ |
| uploads/catalog/kashmiri-crewel-cushion-cover.jpg | https://www.pexels.com/photo/34887544/ |
| uploads/catalog/jaipur-blue-pottery-surahi-vase.jpg | https://www.pexels.com/photo/20239419/ |
| uploads/catalog/blue-pottery-circle-planter.jpg | https://www.pexels.com/photo/38108950/ |
| uploads/catalog/warli-terracotta-planter.jpg | https://www.pexels.com/photo/11664431/ |
| uploads/catalog/terracotta-diya-set-24.jpg | https://www.pexels.com/photo/39189948/ |
| uploads/catalog/terracotta-bud-vase-trio.jpg | https://www.pexels.com/photo/30698565/ |
| uploads/catalog/khurja-stoneware-chai-cups.jpg | https://www.pexels.com/photo/28509629/ |
| uploads/catalog/cane-cylinder-pendant-lamp.jpg | https://www.pexels.com/photo/3554241/ |
| uploads/catalog/bamboo-dome-pendant-lamp.jpg | https://www.pexels.com/photo/36721671/ |
| uploads/catalog/cane-round-serving-tray.jpg | https://www.pexels.com/photo/25286921/ |
| uploads/catalog/bamboo-round-storage-baskets.jpg | https://www.pexels.com/photo/31047258/ |
| uploads/catalog/khasi-bamboo-carry-basket.jpg | https://www.pexels.com/photo/38037370/ |
| uploads/catalog/bamboo-bread-basket-set.jpg | https://www.pexels.com/photo/8093411/ |
| uploads/catalog/channapatna-spinning-tops.jpg | https://www.pexels.com/photo/39468207/ |
| uploads/catalog/carved-wooden-elephant-pair.jpg | https://www.pexels.com/photo/11450666/ |
| uploads/catalog/carved-sheesham-money-box.jpg | https://www.pexels.com/photo/6534321/ |
| uploads/catalog/sheesham-nesting-bowl-set.jpg | https://www.pexels.com/photo/31703678/ |
| uploads/catalog/mango-wood-serving-set.jpg | https://www.pexels.com/photo/6962761/ |
| uploads/catalog/hand-painted-wooden-elephant.jpg | https://www.pexels.com/photo/36769191/ |
| uploads/catalog/bastar-dhokra-spouted-vessel.jpg | https://www.pexels.com/photo/39032263/ |
| uploads/catalog/brass-ganesha-tree-idol.jpg | https://www.pexels.com/photo/12573352/ |
| uploads/catalog/swamimalai-bronze-krishna.jpg | https://www.pexels.com/photo/33799082/ |
| uploads/catalog/brass-embossed-elephant.jpg | https://www.pexels.com/photo/10543346/ |
| uploads/catalog/brass-temple-bell.jpg | https://www.pexels.com/photo/10686421/ |
| uploads/catalog/brass-oil-diya-set.jpg | https://www.pexels.com/photo/34431714/ |
| uploads/catalog/madhubani-fish-lotus-painting.jpg | https://www.pexels.com/photo/34961656/ |
| uploads/catalog/madhubani-goddess-painting.jpg | https://www.pexels.com/photo/30108529/ |
| uploads/catalog/odisha-pattachitra-scroll.jpg | https://www.pexels.com/photo/22820070/ |
| uploads/catalog/bengal-patachitra-coasters.jpg | https://www.pexels.com/photo/36817155/ |
| uploads/catalog/pomegranate-mini-canvas.jpg | https://www.pexels.com/photo/26274827/ |
| uploads/catalog/rajasthani-painted-wooden-panel.jpg | https://www.pexels.com/photo/37148173/ |
| images/storefront/hero-weaver.jpg | https://www.pexels.com/photo/32673642/ |
| images/storefront/hero-potter.jpg | https://www.pexels.com/photo/36779010/ |
| images/storefront/hero-blockprint.jpg | https://www.pexels.com/photo/7037689/ |
| images/storefront/hero-woodcarver.jpg | https://www.pexels.com/photo/37011185/ |
