// A small, bundled storefront for an APK that is opened without a reachable
// backend. Live API products always take precedence. These are the same
// documented sample listings used by backend/scripts/seed_catalog.py.
const item = (id, artisanId, artisanName, productName, category, craftType, material, region, price, stock, image, badge = null, translations = {}) => ({
  id: `offline-${id}`,
  artisan_id: `offline-${artisanId}`,
  artisan_name: artisanName,
  product_name: productName,
  title: productName,
  title_hindi: translations.hi,
  title_telugu: translations.te,
  short_description: translations.description,
  category,
  craft_type: craftType,
  material,
  region,
  suggested_price: price,
  stock_quantity: stock,
  total_cost: Math.round(price * 0.64),
  status: 'Published',
  created_at: `2026-06-${String(Math.min(28, id)).padStart(2, '0')}T10:00:00Z`,
  badge,
  is_featured: true,
  enhanced_image: `/images/catalog/${image}`,
  offline_sample: true,
});

export const OFFLINE_CATALOG = [
  item(15, 19, 'Meenakshi Sundaram', 'Kanchipuram Pure Silk Saree with Zari Buttas', 'Handloom & Textiles', 'Kanchipuram Silk Weaving', 'Pure mulberry silk with zari', 'Kanchipuram, Tamil Nadu', 14500, 3, 'kanchipuram-silk-saree.jpg', 'GI-tagged craft', { hi: 'बुट्टा ज़री वाली शुद्ध कांचीपुरम रेशमी साड़ी', te: 'జరీ బుట్టాలతో స్వచ్ఛమైన కంచిపట్టు చీర', description: 'A rich handwoven silk saree with repeating zari buttas, woven on a traditional pit loom.' }),
  item(19, 24, 'Sunita Jha', 'Madhubani Hand-Painted Tussar Silk Dupatta', 'Handloom & Textiles', 'Madhubani Painting', 'Tussar silk', 'Madhubani, Bihar', 4200, 6, 'madhubani-tussar-dupatta.jpg', 'GI-tagged craft', { hi: 'मधुबनी हाथ से पेंट किया तसर सिल्क दुपट्टा', te: 'మధుబని చేతి చిత్రణ టస్సర్ పట్టు దుపట్టా', description: 'A natural tussar silk dupatta with a hand-painted Madhubani fish border.' }),
  item(21, 25, 'Gopal Prajapat', 'Jaipur Blue Pottery Surahi Vase', 'Pottery & Ceramics', 'Jaipur Blue Pottery', 'Quartz powder, glass and multani mitti', 'Jaipur, Rajasthan', 2850, 7, 'jaipur-blue-pottery-surahi-vase.jpg', 'GI-tagged craft', { hi: 'जयपुर ब्लू पॉटरी सुराही फूलदान', te: 'జైపూర్ బ్లూ పాటరీ సురాహీ పూలకుండీ', description: 'A tall surahi-shaped vase hand-painted with cobalt floral work.' }),
  item(27, 28, 'Bipul Das', 'Handwoven Cane Cylinder Pendant Lamp', 'Cane & Bamboo', 'Assam Cane Weaving', 'Split cane on a steel frame', 'Barpeta, Assam', 2300, 8, 'cane-cylinder-pendant-lamp.jpg', null, { hi: 'हाथ से बुना बेंत का सिलिंडर पेंडेंट लैंप', te: 'చేతితో అల్లిన బెత్తం సిలిండర్ వేలాడే దీపం', description: 'A two-tier cane pendant that casts a soft, patterned glow.' }),
  item(33, 31, 'Venkatesh Gowda', 'Channapatna Lacquered Spinning Tops (Set of 6)', 'Woodcraft & Carving', 'Channapatna Toys', 'Hale wood with lac colours', 'Channapatna, Karnataka', 450, 40, 'channapatna-spinning-tops.jpg', 'GI-tagged craft', { hi: 'चन्नपटना लाख वाले लट्टू (6 का सेट)', te: 'చెన్నపట్న లక్క బొంగరాలు (6 సెట్)', description: 'Six bright, child-safe spinning tops turned and lacquered by hand.' }),
  item(34, 32, 'Shivakumar Achar', 'Hand-Carved Wooden Elephant Pair (Mother and Calf)', 'Woodcraft & Carving', 'Mysore Wood Carving', 'Sheesham wood', 'Mysuru, Karnataka', 4800, 4, 'carved-wooden-elephant-pair.jpg', null, { hi: 'हाथ से तराशी लकड़ी की हाथी जोड़ी', te: 'చేతితో చెక్కిన చెక్క ఏనుగుల జంట', description: 'A mother elephant and calf carved from a single block of sheesham wood.' }),
  item(39, 34, 'Sukhchand Baghel', 'Bastar Dhokra Spouted Vessel', 'Metal Craft & Bell Metal', 'Dhokra Casting', 'Brass, lost-wax cast', 'Kondagaon, Chhattisgarh', 2400, 5, 'bastar-dhokra-spouted-vessel.jpg', 'GI-tagged craft', { hi: 'बस्तर ढोकरा टोंटी वाला पात्र', te: 'బస్తర్ ఢోక్రా ముక్కు పాత్ర', description: 'A lost-wax cast Dhokra vessel decorated with raised tribal figures.' }),
  item(41, 36, 'R. Raghavan', 'Swamimalai Bronze Venugopal Krishna', 'Metal Craft & Bell Metal', 'Swamimalai Bronze Icons', 'Bronze alloy', 'Swamimalai, Tamil Nadu', 12500, 2, 'swamimalai-bronze-krishna.jpg', 'GI-tagged craft', { hi: 'स्वामीमलाई कांस्य वेणुगोपाल कृष्ण', te: 'స్వామిమలై కంచు వేణుగోపాల కృష్ణుడు', description: 'Krishna playing the flute, cast in bronze by the sthapathi families of Swamimalai.' }),
  item(45, 24, 'Sunita Jha', 'Madhubani Fish and Lotus Painting on Handmade Paper', 'Traditional Paintings', 'Madhubani Painting', 'Handmade paper with natural colours', 'Madhubani, Bihar', 2600, 3, 'madhubani-fish-lotus-painting.jpg', 'GI-tagged craft', { hi: 'हस्तनिर्मित कागज़ पर मधुबनी मछली और कमल चित्र', te: 'చేతి కాగితంపై మధుబని చేప, కమలం చిత్రం', description: 'A vivid Madhubani painting of a fish among lotuses, painted freehand.' }),
  item(47, 37, 'Bhagyashree Mahapatra', 'Pattachitra Mythological Painting on Cloth', 'Traditional Paintings', 'Odisha Pattachitra', 'Treated cloth and natural colours', 'Raghurajpur, Odisha', 8500, 1, 'odisha-pattachitra-scroll.jpg', 'GI-tagged craft', { hi: 'कपड़े पर पट्टचित्र पौराणिक दृश्य', te: 'వస్త్రంపై పట్టచిత్ర పౌరాణిక దృశ్యం', description: 'A richly detailed Pattachitra scene painted on treated cloth in Raghurajpur.' }),
];

export const OFFLINE_STORES = Object.fromEntries(OFFLINE_CATALOG.map((product) => [product.artisan_id, product.artisan_name]));
