import React, { createContext, useContext, useEffect, useState } from 'react';

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'te', name: 'Telugu', label: 'తెలుగు', speechCode: 'te-IN' },
];

export const normalizeLocale = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.startsWith('te') || text.includes('తెలుగు')) return 'te';
  if (text.startsWith('hi') || text.includes('हिन्द') || text.includes('हिंदी')) return 'hi';
  return 'en';
};

const translations = {
  hi: {
    'Independent makers. Thoughtful choices.': 'स्वतंत्र कारीगर। सोच-समझकर चुनी चीज़ें।',
    'Shop by category': 'श्रेणी के अनुसार खरीदें', 'Objects with a soul': 'हर चीज़ में एक कहानी',
    'Handcrafted for a': 'हाथों से बना,', 'life well lived.': 'आपकी ज़िंदगी के लिए।',
    'Discover textiles, thoughtful homeware, and traditional art — with the maker’s story in every detail.': 'कपड़े, घर की खास चीज़ें और पारंपरिक कला खोजें — हर बारीकी में कारीगर की कहानी।',
    'Shop the collection': 'संग्रह से खरीदें', 'Craft. Character. Connection.': 'शिल्प। पहचान। जुड़ाव।',
    'The CraftLink experience': 'CraftLink का अनुभव', 'Discover the people behind the products': 'उत्पाद बनाने वाले लोगों को जानें',
    'Your language, your comfort': 'आपकी भाषा, आपका आराम', 'English, Hindi & Telugu': 'अंग्रेज़ी, हिन्दी और तेलुगु',
    'Details before you decide': 'चुनने से पहले पूरी जानकारी', 'Explore materials, origins, and prices': 'सामग्री, स्थान और कीमत देखें',
    'Discover your craft': 'अपना पसंदीदा शिल्प खोजें', 'A world of handmade.': 'हाथों से बनी चीज़ों की दुनिया।',
    'View all products': 'सभी उत्पाद देखें', 'Browse': 'देखें', 'Woven with character': 'खास बुनाई, खास पहचान',
    'Form meets function': 'सुंदर और काम की', 'Naturally beautiful': 'कुदरती खूबसूरती', 'Made to be kept': 'सहेजकर रखने लायक',
    'Details that shine': 'चमकती बारीकियाँ', 'Art with a story': 'कला के पीछे एक कहानी',
    'Made with care. Chosen by you.': 'प्यार से बना। आपके लिए।', 'Name: A to Z': 'नाम: A से Z',
    'Recently listed': 'हाल में जोड़े गए', 'Any price': 'कोई भी कीमत', 'In stock only': 'केवल उपलब्ध उत्पाद',
    'Showing filtered products': 'चुने हुए फ़िल्टर के उत्पाद', 'of': 'में से', 'products': 'उत्पाद',
    'Show more products': 'और उत्पाद देखें', 'The collection is growing': 'नए शिल्प जल्द आएँगे',
    'Published artisan products will appear here. Check back soon.': 'कारीगरों के प्रकाशित उत्पाद यहाँ दिखेंगे। जल्द फिर देखें।',
    'Pottery taking shape in an artisan workshop': 'कारीगर की कार्यशाला में बनते मिट्टी के बर्तन',
    'The art of making': 'बनाने की कला', 'For the hands that create': 'सृजन करने वाले हाथों के लिए',
    'Your craft deserves': 'आपका शिल्प पहुँचे', 'a bigger audience.': 'और ज़्यादा लोगों तक।',
    'Bring your products online with guided photo enhancement and simple voice questions in your language.': 'बेहतर फोटो और अपनी भाषा में आसान आवाज़ वाले सवालों की मदद से अपने उत्पाद ऑनलाइन लाएँ।',
    'Add a photo': 'फोटो जोड़ें', 'Tell your story': 'अपनी कहानी बताएँ', 'Create your listing': 'उत्पाद की जानकारी बनाएँ',
    'Start selling': 'बेचना शुरू करें', 'Photo unavailable': 'फोटो उपलब्ध नहीं',
    'Sign in to track your orders and manage your account.': 'अपने ऑर्डर देखने और खाता संभालने के लिए साइन इन करें।',
    'Manage your products, orders, and inventory in one place.': 'अपने उत्पाद, ऑर्डर और स्टॉक एक जगह संभालें।',
    'New to CraftLink?': 'CraftLink पर नए हैं?', 'Already have an account?': 'पहले से खाता है?', 'Phone Number': 'फ़ोन नंबर',
    'Clear search': 'खोज हटाएँ',
    'AI Computer Vision: Removing background & enhancing studio quality...': 'आपकी फोटो का बैकग्राउंड साफ़ कर रहे हैं और उसे बेहतर बना रहे हैं…',
    'Preparing your first simple question…': 'आपके लिए पहला आसान सवाल तैयार कर रहे हैं…',
    'Checking the words we heard…': 'आपकी कही बात जाँच रहे हैं…',
    'Saving your answer and preparing the next step…': 'आपका जवाब सहेज रहे हैं और अगला कदम तैयार कर रहे हैं…',
    'Generating a verified bilingual marketplace listing...': 'आपके जवाबों से उत्पाद की जानकारी तैयार कर रहे हैं…',
    'Pricing AI: Blending confirmed costs with regional market benchmarks...': 'आपके खर्च और बाज़ार की जानकारी से कीमत का अनुमान लगा रहे हैं…',
    'Submitting to Admin Approval Queue...': 'आपका उत्पाद समीक्षा के लिए भेज रहे हैं…',
    'Close': 'बंद करें', 'Your full name': 'आपका पूरा नाम', 'Email or phone': 'ईमेल या फ़ोन', 'Password': 'पासवर्ड',
    'Create your account': 'अपना खाता बनाएँ', 'Sign in to CraftLink': 'CraftLink में साइन इन करें', 'Seller sign in': 'विक्रेता साइन इन', 'Please wait…': 'कृपया रुकें…',
    'Category': 'श्रेणी', 'Material': 'सामग्री', 'Origin': 'स्थान', 'Dimensions': 'आकार', 'Production time': 'बनाने का समय',
    'Quantity': 'संख्या', 'Increase quantity': 'संख्या बढ़ाएँ', 'Decrease quantity': 'संख्या घटाएँ', 'Added to cart': 'कार्ट में जोड़ा गया',
    'Your cart': 'आपका कार्ट', 'Your cart is empty': 'आपका कार्ट खाली है', 'Continue shopping': 'खरीदारी जारी रखें',
    'Remove': 'हटाएँ', 'Subtotal': 'कुल कीमत', 'Proceed to checkout': 'चेकआउट करें', 'items': 'वस्तुएँ',
    'Shipping is calculated at checkout.': 'डिलीवरी शुल्क चेकआउट पर दिखेगा।',
    'Language': 'भाषा', 'Shop crafts': 'शिल्प खरीदें', 'Sell with us': 'हमारे साथ बेचें',
    'Orders': 'ऑर्डर', 'Cart': 'कार्ट', 'Account': 'खाता', 'Sign in': 'साइन इन',
    'Sign out': 'साइन आउट', 'Seller workspace': 'विक्रेता कार्यक्षेत्र', 'Marketplace': 'बाज़ार',
    'Administration': 'प्रशासन', 'Search crafts, materials, or artisans…': 'शिल्प, सामग्री या कारीगर खोजें…',
    'Search': 'खोजें', 'All crafts': 'सभी शिल्प', 'Handloom': 'हथकरघा', 'Pottery': 'मिट्टी के शिल्प',
    'Woodcraft': 'लकड़ी के शिल्प', 'Metal art': 'धातु कला', 'Bamboo': 'बाँस', 'Paintings': 'चित्रकला',
    'Made by hand. Chosen with heart.': 'हाथों से बना। दिल से चुना।',
    'Discover the craft. Meet the maker.': 'शिल्प खोजें। कारीगर से जुड़ें।',
    'Thoughtful pieces, made by independent artisans. Explore textiles, pottery, and everyday objects with a story.': 'स्वतंत्र कारीगरों की बनाई खास चीज़ें। कपड़े, मिट्टी के शिल्प और रोज़मर्रा की चीज़ों के पीछे की कहानी खोजें।',
    'Explore the collection': 'संग्रह देखें', 'Start your artisan store': 'अपना शिल्प स्टोर शुरू करें',
    'The craft collection': 'शिल्प संग्रह', 'Find something that feels like you.': 'अपने मन की चीज़ खोजें।',
    'pieces to discover': 'चीज़ें उपलब्ध', 'Filters': 'फ़िल्टर', 'Clear filters': 'फ़िल्टर हटाएँ',
    'Sort by': 'क्रम चुनें', 'Recommended': 'सुझाए गए', 'Price: low to high': 'कीमत: कम से अधिक',
    'Price: high to low': 'कीमत: अधिक से कम', 'Maximum price': 'अधिकतम कीमत',
    'No crafts found': 'कोई शिल्प नहीं मिला', 'Try another search or clear your filters.': 'दूसरा शब्द खोजें या फ़िल्टर हटाएँ।',
    'Loading the collection…': 'संग्रह लोड हो रहा है…', 'Could not load the collection.': 'संग्रह लोड नहीं हो पाया।',
    'Try again': 'फिर कोशिश करें', 'View product': 'उत्पाद देखें', 'Add to cart': 'कार्ट में जोड़ें',
    'Buy now': 'अभी खरीदें', 'Out of stock': 'स्टॉक समाप्त', 'Artisan craft': 'कारीगर का शिल्प',
    'GI certified': 'GI प्रमाणित', 'Direct from the maker': 'सीधे कारीगर से', 'Your journey, your language': 'आपकी यात्रा, आपकी भाषा',
    'Shop and create listings in English, Hindi, or Telugu.': 'अंग्रेज़ी, हिन्दी या तेलुगु में खरीदारी करें और उत्पाद जोड़ें।',
    'CraftLink connects people with the hands behind the craft.': 'CraftLink आपको शिल्प बनाने वाले हाथों से जोड़ता है।',
    'Back to top': 'ऊपर जाएँ', 'Explore': 'खोजें', 'For artisans': 'कारीगरों के लिए', 'Your purchases': 'आपकी खरीदारी',
    'Create a store': 'स्टोर बनाएँ', 'Track an order': 'ऑर्डर ट्रैक करें', 'All rights reserved.': 'सर्वाधिकार सुरक्षित।',
    'Dashboard': 'डैशबोर्ड', 'AI Listing Studio': 'AI उत्पाद स्टूडियो', 'My Inventory': 'मेरे उत्पाद',
    'Orders & Shipments': 'ऑर्डर और शिपमेंट', 'Payments & Payouts': 'भुगतान', 'Analytics': 'विश्लेषण',
    'Main Menu': 'मुख्य मेन्यू', 'View Your Storefront': 'अपना बाज़ार देखें', 'Add Listing': 'उत्पाद जोड़ें',
    'Your Store': 'आपका स्टोर', 'Active Store Profile': 'सक्रिय स्टोर', '+ Register New Store': '+ नया स्टोर बनाएँ',
    'Seller Dashboard': 'विक्रेता डैशबोर्ड', 'My Inventory & Catalog': 'मेरे उत्पाद और कैटलॉग',
    'Analytics & Insights': 'विश्लेषण और जानकारी', 'Storefront': 'बाज़ार', 'Open navigation': 'मेन्यू खोलें',
    'Close navigation': 'मेन्यू बंद करें', 'Your creative workspace': 'आपका रचनात्मक कार्यक्षेत्र',
    'A photo. Your story. A listing ready to share.': 'एक फोटो। आपकी कहानी। बेचने के लिए तैयार उत्पाद।',
    'We guide you one step at a time. You can speak or type in your language.': 'हम हर कदम पर मदद करेंगे। आप अपनी भाषा में बोल या लिख सकते हैं।',
    'Add Photo': 'फोटो जोड़ें', 'Answer Questions': 'सवालों के जवाब दें', 'Check Details': 'जानकारी जाँचें',
    'See Fair Price': 'उचित कीमत देखें', 'Send for Review': 'समीक्षा के लिए भेजें',
    'AI cleans the image': 'AI फोटो साफ़ करेगा', 'One simple question at a time': 'एक समय में एक आसान सवाल',
    'Review your words': 'अपने जवाब जाँचें', 'Clear cost calculation': 'खर्च का स्पष्ट हिसाब', 'Final submission': 'अंतिम चरण',
    'First, add one product photo': 'पहले उत्पाद की एक फोटो जोड़ें', 'Do not worry about the background. AI will clean it.': 'बैकग्राउंड की चिंता न करें। AI इसे साफ़ करेगा।',
    'Tap here and choose a photo': 'यहाँ दबाकर फोटो चुनें', 'JPG, PNG or WebP — up to 15MB': 'JPG, PNG या WebP — अधिकतम 15MB',
    'Your photo is ready': 'आपकी फोटो तैयार है', 'Next: Answer simple questions': 'आगे: आसान सवालों के जवाब दें',
    'Photo preview': 'फोटो का पूर्वावलोकन', 'Your enhanced photo will appear here': 'आपकी बेहतर फोटो यहाँ दिखेगी',
    'Choose a clear photo with the whole product visible.': 'एक साफ़ फोटो चुनें जिसमें पूरा उत्पाद दिखे।',
    'Nothing is submitted until you review and confirm.': 'आपकी जाँच और पुष्टि के बाद ही उत्पाद भेजा जाएगा।',
    'Please wait. We are preparing the next step for you.': 'कृपया रुकें। हम आपके लिए अगला कदम तैयार कर रहे हैं।',
    'Updating the question language…': 'सवाल की भाषा बदल रहे हैं…', 'Check your product details': 'अपने उत्पाद की जानकारी जाँचें',
    'Nothing is submitted yet. Read the details below and use Edit if anything needs changing.': 'अभी कुछ भेजा नहीं गया है। नीचे की जानकारी पढ़ें और बदलने के लिए संपादित करें दबाएँ।',
    'Edit': 'संपादित करें', 'Save': 'सहेजें', 'Based only on your answers': 'आपके जवाबों पर आधारित',
    'Product details': 'उत्पाद की जानकारी', 'Details from your photo and answers': 'आपकी फोटो और जवाबों से मिली जानकारी',
    'Your product story': 'आपके उत्पाद की कहानी', 'Listen': 'सुनें', 'Stop': 'रोकें',
  },
  te: {
    'Independent makers. Thoughtful choices.': 'స్వతంత్ర కళాకారులు. ఆలోచించి ఎంచుకున్న వస్తువులు.',
    'Shop by category': 'వర్గం ప్రకారం కొనండి', 'Objects with a soul': 'ప్రతి వస్తువులో ఒక కథ',
    'Handcrafted for a': 'చేతులతో చేసిన కళ,', 'life well lived.': 'మీ జీవితానికి అందం.',
    'Discover textiles, thoughtful homeware, and traditional art — with the maker’s story in every detail.': 'చేనేత, ఇంటికి ప్రత్యేక వస్తువులు మరియు సంప్రదాయ కళను కనుగొనండి — ప్రతి వివరంలో కళాకారుడి కథ ఉంది.',
    'Shop the collection': 'సేకరణ నుండి కొనండి', 'Craft. Character. Connection.': 'కళ. ప్రత్యేకత. అనుబంధం.',
    'The CraftLink experience': 'CraftLink అనుభవం', 'Discover the people behind the products': 'ఉత్పత్తులు చేసిన కళాకారులను తెలుసుకోండి',
    'Your language, your comfort': 'మీ భాష, మీ సౌకర్యం', 'English, Hindi & Telugu': 'ఇంగ్లీష్, హిందీ మరియు తెలుగు',
    'Details before you decide': 'ఎంచుకునే ముందు పూర్తి వివరాలు', 'Explore materials, origins, and prices': 'పదార్థాలు, ప్రాంతం మరియు ధర చూడండి',
    'Discover your craft': 'మీకు నచ్చిన కళను కనుగొనండి', 'A world of handmade.': 'చేతులతో చేసిన కళా ప్రపంచం.',
    'View all products': 'అన్ని ఉత్పత్తులు చూడండి', 'Browse': 'చూడండి', 'Woven with character': 'ప్రత్యేకతతో నేసినవి',
    'Form meets function': 'అందం మరియు ఉపయోగం', 'Naturally beautiful': 'సహజమైన అందం', 'Made to be kept': 'పదిలంగా ఉంచుకునే కళ',
    'Details that shine': 'మెరిసే నైపుణ్యం', 'Art with a story': 'ఒక కథ చెప్పే కళ',
    'Made with care. Chosen by you.': 'శ్రద్ధతో చేసినవి. మీ కోసం.', 'Name: A to Z': 'పేరు: A నుండి Z',
    'Recently listed': 'ఇటీవల చేర్చినవి', 'Any price': 'ఏ ధరైనా', 'In stock only': 'అందుబాటులో ఉన్నవే',
    'Showing filtered products': 'ఎంచుకున్న ఫిల్టర్ల ఉత్పత్తులు', 'of': 'లో', 'products': 'ఉత్పత్తులు',
    'Show more products': 'మరిన్ని ఉత్పత్తులు చూడండి', 'The collection is growing': 'కొత్త కళాఖండాలు త్వరలో వస్తాయి',
    'Published artisan products will appear here. Check back soon.': 'కళాకారులు ప్రచురించిన ఉత్పత్తులు ఇక్కడ కనిపిస్తాయి. త్వరలో మళ్లీ చూడండి.',
    'Pottery taking shape in an artisan workshop': 'కళాకారుడి పని ప్రదేశంలో తయారవుతున్న మట్టి కుండలు',
    'The art of making': 'తయారుచేసే కళ', 'For the hands that create': 'సృజించే చేతుల కోసం',
    'Your craft deserves': 'మీ కళ చేరాలి', 'a bigger audience.': 'మరింత మందికి.',
    'Bring your products online with guided photo enhancement and simple voice questions in your language.': 'మెరుగైన ఫోటో మరియు మీ భాషలో సులభమైన వాయిస్ ప్రశ్నల సహాయంతో మీ ఉత్పత్తులను ఆన్‌లైన్‌లో చేర్చండి.',
    'Add a photo': 'ఫోటో చేర్చండి', 'Tell your story': 'మీ కథ చెప్పండి', 'Create your listing': 'ఉత్పత్తి వివరాలు చేర్చండి',
    'Start selling': 'అమ్మడం ప్రారంభించండి', 'Photo unavailable': 'ఫోటో అందుబాటులో లేదు',
    'Sign in to track your orders and manage your account.': 'మీ ఆర్డర్లు చూడటానికి మరియు ఖాతాను నిర్వహించడానికి సైన్ ఇన్ చేయండి.',
    'Manage your products, orders, and inventory in one place.': 'మీ ఉత్పత్తులు, ఆర్డర్లు మరియు స్టాక్‌ను ఒకే చోట నిర్వహించండి.',
    'New to CraftLink?': 'CraftLink కు కొత్తా?', 'Already have an account?': 'ఇప్పటికే ఖాతా ఉందా?', 'Phone Number': 'ఫోన్ నంబర్',
    'Clear search': 'వెతికిన పదం తొలగించండి',
    'AI Computer Vision: Removing background & enhancing studio quality...': 'మీ ఫోటో బ్యాక్‌గ్రౌండ్‌ను శుభ్రం చేసి మెరుగుపరుస్తున్నాం…',
    'Preparing your first simple question…': 'మీ కోసం మొదటి సులభమైన ప్రశ్న సిద్ధం చేస్తున్నాం…',
    'Checking the words we heard…': 'మీరు చెప్పిన మాటలను పరిశీలిస్తున్నాం…',
    'Saving your answer and preparing the next step…': 'మీ జవాబు సేవ్ చేసి తదుపరి దశ సిద్ధం చేస్తున్నాం…',
    'Generating a verified bilingual marketplace listing...': 'మీ జవాబులతో ఉత్పత్తి వివరాలు సిద్ధం చేస్తున్నాం…',
    'Pricing AI: Blending confirmed costs with regional market benchmarks...': 'మీ ఖర్చు మరియు మార్కెట్ వివరాలతో ధర అంచనా వేస్తున్నాం…',
    'Submitting to Admin Approval Queue...': 'మీ ఉత్పత్తిని సమీక్ష కోసం పంపుతున్నాం…',
    'Close': 'మూసివేయండి', 'Your full name': 'మీ పూర్తి పేరు', 'Email or phone': 'ఈమెయిల్ లేదా ఫోన్', 'Password': 'పాస్‌వర్డ్',
    'Create your account': 'మీ ఖాతా సృష్టించండి', 'Sign in to CraftLink': 'CraftLink లో సైన్ ఇన్ చేయండి', 'Seller sign in': 'విక్రేత సైన్ ఇన్', 'Please wait…': 'దయచేసి వేచి ఉండండి…',
    'Category': 'వర్గం', 'Material': 'పదార్థం', 'Origin': 'ప్రాంతం', 'Dimensions': 'కొలతలు', 'Production time': 'తయారీ సమయం',
    'Quantity': 'సంఖ్య', 'Increase quantity': 'సంఖ్య పెంచండి', 'Decrease quantity': 'సంఖ్య తగ్గించండి', 'Added to cart': 'కార్ట్‌లో చేర్చబడింది',
    'Your cart': 'మీ కార్ట్', 'Your cart is empty': 'మీ కార్ట్ ఖాళీగా ఉంది', 'Continue shopping': 'కొనుగోలు కొనసాగించండి',
    'Remove': 'తీసేయండి', 'Subtotal': 'మొత్తం ధర', 'Proceed to checkout': 'చెకౌట్ చేయండి', 'items': 'వస్తువులు',
    'Shipping is calculated at checkout.': 'డెలివరీ ఖర్చు చెకౌట్‌లో కనిపిస్తుంది.',
    'Language': 'భాష', 'Shop crafts': 'కళాఖండాలు కొనండి', 'Sell with us': 'మాతో అమ్మండి',
    'Orders': 'ఆర్డర్లు', 'Cart': 'కార్ట్', 'Account': 'ఖాతా', 'Sign in': 'సైన్ ఇన్',
    'Sign out': 'సైన్ అవుట్', 'Seller workspace': 'విక్రేత కార్యస్థలం', 'Marketplace': 'మార్కెట్',
    'Administration': 'నిర్వహణ', 'Search crafts, materials, or artisans…': 'కళాఖండాలు, పదార్థాలు లేదా కళాకారులను వెతకండి…',
    'Search': 'వెతకండి', 'All crafts': 'అన్ని కళాఖండాలు', 'Handloom': 'చేనేత', 'Pottery': 'మట్టి కళ',
    'Woodcraft': 'చెక్క కళ', 'Metal art': 'లోహ కళ', 'Bamboo': 'వెదురు', 'Paintings': 'చిత్రాలు',
    'Made by hand. Chosen with heart.': 'చేతులతో తయారైంది. మనసుతో ఎంచుకున్నది.',
    'Discover the craft. Meet the maker.': 'కళను కనుగొనండి. కళాకారుడితో కలవండి.',
    'Thoughtful pieces, made by independent artisans. Explore textiles, pottery, and everyday objects with a story.': 'స్వతంత్ర కళాకారులు తయారుచేసిన ప్రత్యేక వస్తువులు. చేనేత, మట్టి కళ మరియు రోజువారీ వస్తువుల కథలను తెలుసుకోండి.',
    'Explore the collection': 'సేకరణ చూడండి', 'Start your artisan store': 'మీ కళల దుకాణం ప్రారంభించండి',
    'The craft collection': 'కళాఖండాల సేకరణ', 'Find something that feels like you.': 'మీ మనసుకు నచ్చినది ఎంచుకోండి.',
    'pieces to discover': 'వస్తువులు అందుబాటులో ఉన్నాయి', 'Filters': 'ఫిల్టర్లు', 'Clear filters': 'ఫిల్టర్లు తీసేయండి',
    'Sort by': 'క్రమం ఎంచుకోండి', 'Recommended': 'సూచించినవి', 'Price: low to high': 'ధర: తక్కువ నుండి ఎక్కువ',
    'Price: high to low': 'ధర: ఎక్కువ నుండి తక్కువ', 'Maximum price': 'గరిష్ఠ ధర',
    'No crafts found': 'కళాఖండాలు కనిపించలేదు', 'Try another search or clear your filters.': 'మరొక పదంతో వెతకండి లేదా ఫిల్టర్లు తీసేయండి.',
    'Loading the collection…': 'సేకరణ లోడ్ అవుతోంది…', 'Could not load the collection.': 'సేకరణ లోడ్ కాలేదు.',
    'Try again': 'మళ్లీ ప్రయత్నించండి', 'View product': 'ఉత్పత్తిని చూడండి', 'Add to cart': 'కార్ట్‌లో చేర్చండి',
    'Buy now': 'ఇప్పుడే కొనండి', 'Out of stock': 'స్టాక్ లేదు', 'Artisan craft': 'కళాకారుడి కళ',
    'GI certified': 'GI ధృవీకరించబడింది', 'Direct from the maker': 'నేరుగా కళాకారుడి నుండి', 'Your journey, your language': 'మీ ప్రయాణం, మీ భాష',
    'Shop and create listings in English, Hindi, or Telugu.': 'ఇంగ్లీష్, హిందీ లేదా తెలుగులో కొనండి, ఉత్పత్తులు చేర్చండి.',
    'CraftLink connects people with the hands behind the craft.': 'CraftLink మిమ్మల్ని కళను సృష్టించే కళాకారులతో కలుపుతుంది.',
    'Back to top': 'పైకి వెళ్లండి', 'Explore': 'చూడండి', 'For artisans': 'కళాకారుల కోసం', 'Your purchases': 'మీ కొనుగోళ్లు',
    'Create a store': 'దుకాణం సృష్టించండి', 'Track an order': 'ఆర్డర్ ట్రాక్ చేయండి', 'All rights reserved.': 'అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.',
    'Dashboard': 'డాష్‌బోర్డ్', 'AI Listing Studio': 'AI ఉత్పత్తి స్టూడియో', 'My Inventory': 'నా ఉత్పత్తులు',
    'Orders & Shipments': 'ఆర్డర్లు మరియు షిప్‌మెంట్లు', 'Payments & Payouts': 'చెల్లింపులు', 'Analytics': 'విశ్లేషణ',
    'Main Menu': 'ప్రధాన మెనూ', 'View Your Storefront': 'మీ మార్కెట్ చూడండి', 'Add Listing': 'ఉత్పత్తి చేర్చండి',
    'Your Store': 'మీ దుకాణం', 'Active Store Profile': 'ఎంచుకున్న దుకాణం', '+ Register New Store': '+ కొత్త దుకాణం సృష్టించండి',
    'Seller Dashboard': 'విక్రేత డాష్‌బోర్డ్', 'My Inventory & Catalog': 'నా ఉత్పత్తులు మరియు కేటలాగ్',
    'Analytics & Insights': 'విశ్లేషణ మరియు సమాచారం', 'Storefront': 'మార్కెట్', 'Open navigation': 'మెనూ తెరవండి',
    'Close navigation': 'మెనూ మూసివేయండి', 'Your creative workspace': 'మీ సృజనాత్మక కార్యస్థలం',
    'A photo. Your story. A listing ready to share.': 'ఒక ఫోటో. మీ కథ. అమ్మడానికి సిద్ధమైన ఉత్పత్తి.',
    'We guide you one step at a time. You can speak or type in your language.': 'ప్రతి దశలో మేము సహాయం చేస్తాం. మీరు మీ భాషలో మాట్లాడవచ్చు లేదా టైప్ చేయవచ్చు.',
    'Add Photo': 'ఫోటో చేర్చండి', 'Answer Questions': 'ప్రశ్నలకు జవాబులు', 'Check Details': 'వివరాలు చూడండి',
    'See Fair Price': 'సరైన ధర చూడండి', 'Send for Review': 'సమీక్షకు పంపండి',
    'AI cleans the image': 'AI ఫోటో శుభ్రం చేస్తుంది', 'One simple question at a time': 'ఒకేసారి ఒక సులభమైన ప్రశ్న',
    'Review your words': 'మీ సమాధానాలు చూడండి', 'Clear cost calculation': 'ఖర్చు స్పష్టమైన లెక్క', 'Final submission': 'చివరి దశ',
    'First, add one product photo': 'మొదట ఉత్పత్తి ఫోటో చేర్చండి', 'Do not worry about the background. AI will clean it.': 'బ్యాక్‌గ్రౌండ్ గురించి ఆందోళన వద్దు. AI శుభ్రం చేస్తుంది.',
    'Tap here and choose a photo': 'ఇక్కడ నొక్కి ఫోటో ఎంచుకోండి', 'JPG, PNG or WebP — up to 15MB': 'JPG, PNG లేదా WebP — గరిష్ఠంగా 15MB',
    'Your photo is ready': 'మీ ఫోటో సిద్ధంగా ఉంది', 'Next: Answer simple questions': 'తర్వాత: సులభమైన ప్రశ్నలకు జవాబులు',
    'Photo preview': 'ఫోటో ప్రివ్యూ', 'Your enhanced photo will appear here': 'మీ మెరుగైన ఫోటో ఇక్కడ కనిపిస్తుంది',
    'Choose a clear photo with the whole product visible.': 'ఉత్పత్తి మొత్తం కనిపించే స్పష్టమైన ఫోటో ఎంచుకోండి.',
    'Nothing is submitted until you review and confirm.': 'మీరు చూసి నిర్ధారించే వరకు ఉత్పత్తి పంపబడదు.',
    'Please wait. We are preparing the next step for you.': 'దయచేసి వేచి ఉండండి. మీ కోసం తదుపరి దశను సిద్ధం చేస్తున్నాం.',
    'Updating the question language…': 'ప్రశ్న భాషను మారుస్తున్నాం…', 'Check your product details': 'మీ ఉత్పత్తి వివరాలు చూడండి',
    'Nothing is submitted yet. Read the details below and use Edit if anything needs changing.': 'ఇంకా ఏమీ పంపలేదు. కింద వివరాలు చదవండి. మార్చడానికి సవరించండి నొక్కండి.',
    'Edit': 'సవరించండి', 'Save': 'సేవ్ చేయండి', 'Based only on your answers': 'మీ సమాధానాల ఆధారంగా',
    'Product details': 'ఉత్పత్తి వివరాలు', 'Details from your photo and answers': 'మీ ఫోటో మరియు సమాధానాల నుండి వివరాలు',
    'Your product story': 'మీ ఉత్పత్తి కథ', 'Listen': 'వినండి', 'Stop': 'ఆపండి',
  },
};

// Preserve context identity during development refreshes so existing consumers
// never momentarily read a different context from the refreshed provider.
const LanguageContext = import.meta.hot?.data.languageContext || createContext(null);
if (import.meta.hot) import.meta.hot.data.languageContext = LanguageContext;

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try { return normalizeLocale(localStorage.getItem('craftlink_language') || 'en'); }
    catch { return 'en'; }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('craftlink_language', locale); } catch { /* private browsing */ }
  }, [locale]);
  const language = LANGUAGE_OPTIONS.find(item => item.code === locale);
  const t = (key) => translations[locale]?.[key] || key;
  return (
    <LanguageContext.Provider value={{ locale, language, t, setLocale: value => setLocale(normalizeLocale(value)) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
