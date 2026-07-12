export interface FabricDetails {
  slug: string;
  name: string;
  heroDescription: string;
  howItsMade: string;
  whereItsMade: string;
  history: string;
  benefits: string[];
  useCases: string[];
  fashionTrends: string;
}

export const fabricData: Record<string, FabricDetails> = {
  linen: {
    slug: 'linen',
    name: 'Linen',
    heroDescription: 'Renowned for its exceptional breathability, crisp texture, and natural elegance, linen is a premium textile woven from the fibers of the flax plant. It is widely celebrated as the ultimate warm-weather fabric, offering effortless sophistication and timeless appeal.',
    howItsMade: 'Linen production is a labor-intensive process that begins with harvesting flax plants. Once harvested, the plants undergo retting, a process where they are soaked in water to break down the natural pectin holding the fibers together. Following this, the stalks are subjected to scutching and heckling to separate the long, usable fibers from the woody core. These fine fibers are then spun into yarn and woven into fabric. The complexity of extracting and processing flax fibers is why linen is often more expensive than other natural fabrics, as it requires specialized care and expertise at every stage.',
    whereItsMade: 'Historically, the finest linen originated from Europe, specifically countries like Belgium, France, and Italy, where the cool, damp climate is ideal for growing high-quality flax. Today, European linen remains highly prized, though significant production also occurs in Eastern Europe, China, and India. Indian linen, in particular, blends traditional craftsmanship with modern weaving techniques to produce high-quality textiles tailored for both domestic and international markets.',
    history: 'Linen is one of the oldest textiles in human history, with evidence of its use dating back over 30,000 years. In ancient Egypt, linen was considered a symbol of light and purity, famously used for both the everyday garments of the affluent and the mummification of pharaohs. Throughout the Middle Ages and the Renaissance in Europe, linen was the primary fabric for undergarments, bedding, and table dressings—so much so that the word "lingerie" is derived from the French word for linen, "lin". Its historical legacy is deeply intertwined with human civilization, representing resilience and enduring quality.',
    benefits: [
      'Exceptional breathability and moisture-wicking properties',
      'Highly durable, becoming softer with every wash',
      'Hypoallergenic and naturally antibacterial',
      'Biodegradable and environmentally friendly when organically sourced'
    ],
    useCases: [
      'Summer suits, trousers, and tailored jackets',
      'Breezy dresses, tunics, and casual shirts',
      'Premium home textiles including bedsheets, tablecloths, and curtains',
      'Lightweight scarves and accessories'
    ],
    fashionTrends: 'In contemporary fashion, linen is experiencing a major resurgence as consumers gravitate towards sustainable, natural fibers. Internationally, relaxed "resort wear" and effortless minimalism have made linen suits and oversized shirts staple wardrobe items. In India, linen has seamlessly transitioned into ethnic and fusion wear, with linen sarees, kurtas, and tailored bandhgalas becoming immensely popular for their comfort in the sweltering heat and their sophisticated, understated aesthetic.'
  },
  cotton: {
    slug: 'cotton',
    name: 'Cotton',
    heroDescription: 'The most widely used natural fiber globally, cotton is beloved for its incredible softness, everyday comfort, and unparalleled versatility. From lightweight summer tees to sturdy denim, it is the foundational fabric of the modern wardrobe.',
    howItsMade: 'Cotton is harvested from the fluffy bolls of the cotton plant. Once picked, it goes through a ginning process to separate the soft cellulose fibers from the seeds. These fibers are then cleaned, carded to align them, and spun into yarn. Depending on the desired end product, the yarn can be woven or knitted into a vast array of fabrics, ranging from sheer voile to heavy canvas.',
    whereItsMade: 'Cotton is cultivated globally in warm climates. The top producers include India, China, the United States, Pakistan, and Brazil. India holds a particularly significant position, boasting a massive textile industry and being the world\'s largest producer of cotton, supplying everything from everyday commercial fabrics to exquisite handloom variants.',
    history: 'Cotton cultivation dates back over 7,000 years, with the earliest evidence found in the Indus Valley Civilization (modern-day India and Pakistan) and simultaneously in Mesoamerica. By the Middle Ages, Arab merchants had introduced cotton to Europe. The Industrial Revolution in the 18th and 19th centuries, spurred by inventions like the spinning jenny and the cotton gin, transformed cotton into a cheap, mass-produced global commodity, fundamentally changing the world economy.',
    benefits: [
      'Extremely soft and comfortable against the skin',
      'Highly breathable and absorbs moisture well',
      'Easy to care for and can withstand high temperatures',
      'Versatile enough to be woven into countless textures'
    ],
    useCases: [
      'Everyday apparel such as t-shirts, jeans, and dresses',
      'Undergarments and socks',
      'Household textiles like towels and bed linens',
      'Medical supplies and industrial threads'
    ],
    fashionTrends: 'Cotton remains the undisputed king of casual wear. Recently, there has been a massive shift toward organic and regenerative cotton as the industry reckons with environmental concerns. Oversized streetwear aesthetics heavily rely on heavyweight cotton jerseys, while timeless classic shirting remains a staple of "quiet luxury." In India, the revival of indigenous cotton weaves, such as Khadi, continues to dominate the slow fashion movement.'
  },
  viscose: {
    slug: 'viscose',
    name: 'Viscose',
    heroDescription: 'Also known as rayon, viscose is a semi-synthetic marvel that perfectly mimics the luxurious drape and feel of silk while maintaining the breathability and affordability of cotton.',
    howItsMade: 'Viscose is manufactured from regenerated cellulose, typically sourced from wood pulp (such as beech, pine, or bamboo). The wood pulp is chemically treated with sodium hydroxide and carbon disulfide to form a viscous liquid—hence the name. This thick liquid is then forced through a spinneret into an acid bath, which solidifies it into fine fibers that are spun into yarn.',
    whereItsMade: 'The production of viscose is highly industrialized and centered in countries with strong chemical and textile manufacturing sectors. China, India, and Indonesia are the dominant global producers. Modern sustainable variants, such as those made by Lenzing (TENCEL™ and ECOVERO™), are produced primarily in Europe with strict environmental controls.',
    history: 'Viscose was invented in the late 19th century by French scientist Hilaire de Chardonnet as an "artificial silk." It was designed to provide the masses with a cheaper alternative to real silk, which was prohibitively expensive. By the 1920s and 30s, it became widely popular for women\'s undergarments and fluid dresses, revolutionizing the fashion industry by democratizing luxurious textures.',
    benefits: [
      'Beautiful, fluid drape that flatters the silhouette',
      'Breathable and comfortable in warm weather',
      'Takes dye brilliantly, resulting in vibrant, lasting colors',
      'Cost-effective alternative to silk'
    ],
    useCases: [
      'Flowy summer dresses, skirts, and blouses',
      'Soft linings for suits and jackets',
      'Lightweight loungewear and sleepwear',
      'Blended with other fibers to improve drape and softness'
    ],
    fashionTrends: 'Viscose is a powerhouse in the fast fashion industry due to its affordability and silk-like properties. Currently, the trend is shifting heavily towards eco-friendly viscose (like ECOVERO), addressing the environmental impact of traditional manufacturing. It is the go-to fabric for the popular fluid, slip-dress silhouettes and feminine, romantic blouses that dominate spring and summer collections worldwide.'
  },
  flannel: {
    slug: 'flannel',
    name: 'Flannel',
    heroDescription: 'A soft, woven fabric celebrated for its incredible warmth, coziness, and slightly fuzzy surface. Flannel is synonymous with crisp autumn days, rugged outdoor wear, and comforting winter nights.',
    howItsMade: 'Flannel can be woven from wool, cotton, or synthetic fibers. What gives flannel its signature texture is the finishing process called "napping." The woven fabric is passed over cylinders with fine metal brushes that gently raise the loose fibers on one or both sides of the cloth. This creates a soft, fuzzy pile that traps air, making the fabric exceptionally good at retaining heat.',
    whereItsMade: 'Historically originating in Wales, flannel production has gone global. Today, high-quality, heavy wool flannels for tailoring are often produced in the UK and Italy. Meanwhile, plush cotton flannels for casual wear and bedding are heavily manufactured in Portugal, China, and India.',
    history: 'Flannel originated in 17th century Wales, created to protect farmers and outdoor workers from the bitter, wet winters. By the 19th century, it was widely adopted in North America for rugged workwear. In the 20th century, the flannel suit became a hallmark of mid-century corporate America (famously depicted in "The Man in the Gray Flannel Suit"), while plaid cotton flannel became forever immortalized by the 1990s grunge music scene.',
    benefits: [
      'Excellent insulation and heat retention',
      'Incredibly soft and comfortable against the skin',
      'Durable and resistant to wear and tear',
      'Available in both lightweight cotton and heavy wool variations'
    ],
    useCases: [
      'Classic plaid button-down shirts and overshirts',
      'Cozy winter pajamas and loungewear',
      'Warm winter bedding and blankets',
      'Tailored winter suits and trousers'
    ],
    fashionTrends: 'Flannel continuously cycles in and out of the fashion spotlight but never truly leaves. Recently, it has seen a massive resurgence through the "workwear" and "gorpcore" aesthetics, with oversized flannel overshirts acting as transitional outerwear. In luxury fashion, high-twist wool flannel trousers and softly tailored suits are highly sought after for a relaxed yet refined winter wardrobe.'
  },
  corduroy: {
    slug: 'corduroy',
    name: 'Corduroy',
    heroDescription: 'A durable, textured fabric instantly recognizable by its raised vertical ridges, or "wales." Corduroy offers a unique blend of rugged utilitarianism, vintage charm, and unexpected sophistication.',
    howItsMade: 'Corduroy is a variation of a woven pile fabric, usually made from cotton or a cotton-polyester blend. It is woven with extra sets of fiber that are floated over the surface. These floating threads are then cut and brushed to form tufted cords (wales) running the length of the fabric. The size of the cord is measured in wales per inch; a lower number indicates thicker, wider cords (jumbo cord), while a higher number means finer cords (needlecord).',
    whereItsMade: 'Corduroy is produced worldwide, with massive commercial production taking place in Asia. However, the most premium, durable, and richly dyed corduroys are often sourced from historic mills in Italy and Japan, where the craft of cutting and finishing the pile has been perfected over generations.',
    history: 'The precursor to corduroy was a heavy cotton weave known as "fustian," originating in the ancient Egyptian city of Fustat. Corduroy as we know it evolved in 18th-century England and France. Despite the popular myth that it translates to "corde du roi" (cloth of the king), the name is more likely derived from the English words "cord" and "duroy" (a coarse woolen cloth). It became the fabric of the working class during the Industrial Revolution, before being adopted by academics and eventually becoming a fashion staple in the 1970s.',
    benefits: [
      'Exceptional durability and resistance to abrasion',
      'Warm and insulating due to the thick pile structure',
      'Unique tactile texture and visual depth',
      'Ages beautifully, developing a distinctive patina over time'
    ],
    useCases: [
      'Sturdy autumn/winter trousers and chinos',
      'Casual blazers, chore jackets, and overshirts',
      'Durable upholstery and home furnishings',
      'Children\'s wear and accessories'
    ],
    fashionTrends: 'Corduroy is enjoying a major renaissance, riding the wave of 1970s nostalgia and the demand for highly textured fabrics. Chunky, wide-wale corduroy is particularly popular for oversized streetwear jackets and relaxed trousers. In contemporary tailoring, fine needlecord suits in rich jewel tones (emerald, burgundy, navy) are celebrated as stylish, slightly eccentric alternatives to traditional winter wools.'
  },
  twill: {
    slug: 'twill',
    name: 'Twill',
    heroDescription: 'Defined by its structural weave rather than a specific fiber, twill is characterized by its distinct diagonal rib pattern. This complex weave makes it exceptionally strong, durable, and highly versatile across all forms of apparel.',
    howItsMade: 'Twill is created by passing the weft (horizontal) thread over one or more warp (vertical) threads, and then under two or more warp threads. This offset progression with each row creates the signature diagonal pattern, or "wale." The most famous example of a twill weave is denim. Twill can be made from any fiber, though cotton, wool, and silk are the most common.',
    whereItsMade: 'Because twill is a fundamental weaving technique, it is manufactured in virtually every textile-producing nation on Earth. Japan is world-renowned for its premium, artisanal selvedge denim twills, while countries like India, China, and Bangladesh handle the vast majority of commercial cotton twill production for the global garment industry.',
    history: 'Twill is one of the oldest known weave structures in human history, utilized for millennia because it produces a fabric much sturdier and more tear-resistant than a standard plain weave. The word "twill" originates from the Old English word "twili," meaning "half-thread" or "woven with double thread." Its durability made it the historical choice for military uniforms, workwear, and eventually, the iconic blue jean.',
    benefits: [
      'Highly durable and resistant to tearing',
      'Naturally resists wrinkles and creasing',
      'Hides stains and dirt well due to its uneven surface texture',
      'Drapes more elegantly than plain weaves of the same weight'
    ],
    useCases: [
      'Denim jeans and heavy-duty workwear',
      'Chinos and tailored casual trousers',
      'Outerwear including trench coats and military-style jackets',
      'Heavy upholstery and industrial fabrics'
    ],
    fashionTrends: 'Twill is the backbone of casual and utility fashion. The current trend leans heavily into elevated workwear—think perfectly tailored chore coats and wide-leg twill trousers bridging the gap between casual and formal. Sustainable, organically dyed twills are taking center stage. In menswear, heavy cotton twill chinos remain a non-negotiable wardrobe staple, while luxury brands experiment with fluid silk twills for resort wear.'
  },
  suede: {
    slug: 'suede',
    name: 'Suede',
    heroDescription: 'A type of leather with a soft, napped finish, suede exudes luxury, refinement, and a tactile richness that instantly elevates any garment, accessory, or piece of footwear.',
    howItsMade: 'Traditional suede is made from the underside of the animal hide, typically lamb, calf, goat, or deer. The hide is split, and the inner surface is sanded or buffed to create a soft, velvety nap. Because it uses the inner split layer rather than the tough exterior skin, suede is much softer and more pliable than standard full-grain leather, though less durable. Today, highly realistic synthetic alternatives (microsuede) are also produced from heavily brushed polyester microfibers.',
    whereItsMade: 'High-end, authentic suede is heavily associated with Italian and Spanish tanneries, which are globally celebrated for their masterful leather craftsmanship and ethical processing standards. Synthetic suede and lower-tier natural suedes are manufactured at scale across Asia, particularly in China and India.',
    history: 'The term "suede" originates from the French phrase "gants de Suède," meaning "gloves of Sweden." In the 19th century, incredibly soft, napped leather gloves imported from Sweden became a massive status symbol among the French aristocracy. Throughout the 20th century, suede expanded beyond accessories, becoming an iconic material in 1960s bohemian fashion, 1970s western wear, and luxury footwear.',
    benefits: [
      'Luxuriously soft and pliable against the body',
      'Features a rich, matte finish that absorbs light beautifully',
      'Lightweight compared to standard full-grain leather',
      'Instantly imparts a premium, high-end aesthetic'
    ],
    useCases: [
      'Premium footwear, including loafers, boots, and sneakers',
      'Luxury outerwear, such as bomber and biker jackets',
      'High-end accessories like bags, belts, and gloves',
      'Interior upholstery and car interiors'
    ],
    fashionTrends: 'Suede is heavily featured in the "bohemian chic" and "luxury western" trends dominating recent runways, seen in fringed jackets and cowboy-inspired boots. There is also a massive surge in vegan, plant-based, and recycled synthetic suedes, driven by the fashion industry\'s push towards cruelty-free and sustainable materials. In menswear, the unlined suede overshirt has become a staple of relaxed luxury.'
  },
  velvet: {
    slug: 'velvet',
    name: 'Velvet',
    heroDescription: 'The absolute epitome of textile luxury, velvet is a woven tufted fabric with a dense, uniform pile that gives it an incredibly soft feel and a distinctive, regal sheen.',
    howItsMade: 'Velvet is woven on a specialized double cloth loom that weaves two pieces of fabric simultaneously, face-to-face. A blade then slices the two layers apart down the middle, creating a plush, upright pile on both pieces. Originally, velvet was made exclusively from silk, making it astoundingly expensive. Today, it is commonly made from cotton, viscose, or synthetic blends to achieve different weights, textures, and price points.',
    whereItsMade: 'Historically, the finest velvets were produced in the Middle East and Renaissance Italy. Today, while premium silk velvet is still meticulously crafted in Europe and parts of Asia, commercial cotton and synthetic velvets are produced on a massive scale in China and India, making this once-exclusive fabric accessible worldwide.',
    history: 'Velvet\'s origins trace back to Eastern culture, likely Baghdad or Cairo, before the year 1000 AD. It was introduced to Europe by merchants and quickly became the fabric of the nobility, royalty, and the church during the Renaissance, heavily produced in Italian cities like Venice and Florence. It has remained a symbol of wealth, power, and opulence for centuries, deeply embedded in royal regalia and haute couture.',
    benefits: [
      'Opulent, highly visual appearance with a striking sheen',
      'Extremely soft and comforting to the touch',
      'Drapes elegantly, shaping beautifully to the body',
      'Provides excellent warmth for winter formalwear'
    ],
    useCases: [
      'Evening wear, gala dresses, and tuxedo jackets',
      'Festive traditional wear, including lehengas and sherwanis',
      'Luxury upholstery, drapes, and statement pillows',
      'Accessories like chokers, hairbows, and premium footwear'
    ],
    fashionTrends: 'Velvet is a staple of the "dark academia" and "gothic romance" aesthetics, frequently seen in deep burgundy, emerald, and midnight blue tones. In international menswear, the statement velvet blazer remains the ultimate choice for holiday parties and winter weddings. In India, velvet has seen a massive resurgence in bridal and festive wear, with heavily embroidered velvet lehengas and sherwanis favored for winter weddings.'
  },
  wool: {
    slug: 'wool',
    name: 'Wool',
    heroDescription: 'A natural powerhouse fiber renowned for its exceptional insulation, resilience, and versatility, wool has been protecting humanity from the elements for millennia. From rugged outerwear to incredibly fine suiting, it is nature\'s ultimate performance fabric.',
    howItsMade: 'Wool is primarily derived from the fleece of sheep, though variants come from goats (cashmere, mohair), alpacas, and rabbits (angora). The fleece is sheared from the animal, scoured to remove natural grease (lanolin) and dirt, and then carded or combed to align the fibers. These fibers are spun into yarn and woven or knitted. The processing determines the final texture, ranging from scratchy, heavy tweeds to unbelievably smooth, superfine merino worsteds.',
    whereItsMade: 'Australia and New Zealand dominate the global production of fine merino wool. However, high-end wool weaving and tailoring fabrics are traditionally centered in the UK (particularly Yorkshire and Scotland) and Italy (Biella). India also has a robust wool industry, particularly known for carpets, shawls (like Pashmina), and durable winterwear.',
    history: 'Humans have been using wool for clothing for over 10,000 years. During the Middle Ages, the wool trade was the backbone of the European economy, particularly in England, where it generated immense wealth and political power. The Industrial Revolution mechanized the spinning and weaving of wool, making it widely available. Today, it remains a cornerstone of both rugged utility clothing and high-end bespoke tailoring.',
    benefits: [
      'Excellent natural insulator that retains warmth even when wet',
      'Highly breathable and naturally moisture-wicking',
      'Naturally elastic, resistant to wrinkles, and highly durable',
      'Naturally flame-resistant and odor-resistant'
    ],
    useCases: [
      'Winter coats, peacoats, and heavy outerwear',
      'Fine tailored suits and formal trousers',
      'Knitwear, including sweaters, cardigans, and socks',
      'Home goods like blankets, rugs, and upholstery'
    ],
    fashionTrends: 'The "quiet luxury" movement heavily relies on superfine merino wool and cashmere knits for an understated, wealthy aesthetic. There is a strong global push towards sustainable, traceable, and non-mulesed wool, ensuring animal welfare. In modern activewear, merino wool is being championed as a natural alternative to synthetics due to its breathability and anti-odor properties.'
  },
  fleece: {
    slug: 'fleece',
    name: 'Fleece',
    heroDescription: 'A modern synthetic marvel engineered to mimic the warmth and texture of wool, fleece offers unparalleled coziness in a lightweight, highly functional, and active-friendly format.',
    howItsMade: 'Fleece is entirely synthetic, typically made from polyester. The polyester fibers are knitted together into a fabric, which is then run through a napper—a machine with fine wire brushes that aggressively raise the fibers on the surface. This creates a thick, fuzzy pile that traps heat beautifully. Many modern fleeces are made from recycled PET plastics, such as discarded water bottles, making it an innovative solution in textile recycling.',
    whereItsMade: 'Fleece production is a highly automated industrial process. The majority of commercial fleece is manufactured in Asia, particularly in China and Taiwan, where synthetic textile infrastructure is vast. However, premium performance fleece brands (like Polartec) maintain significant research and manufacturing operations in the United States and Europe.',
    history: 'Unlike ancient natural fibers, fleece has a very recent history. It was invented in 1981 by Malden Mills (now Polartec) in collaboration with the outdoor brand Patagonia. They sought to create a fabric that offered the insulation of wool without its heavy weight when wet. The result was "Polarfleece," which revolutionized outdoor gear and quickly crossed over into mainstream casual wear.',
    benefits: [
      'Exceptionally warm while remaining incredibly lightweight',
      'Hydrophobic, meaning it dries quickly and retains warmth when wet',
      'Vegan and often made from recycled plastic materials',
      'Very easy to care for and machine washable'
    ],
    useCases: [
      'Outdoor activewear, hiking mid-layers, and zip-up jackets',
      'Casual winter hoodies, joggers, and loungewear',
      'Cozy blankets and home throws',
      'Winter accessories like beanies, gloves, and scarves'
    ],
    fashionTrends: 'Fleece is the poster child for the "Gorpcore" trend, where highly functional outdoor gear is worn as everyday streetwear. Vintage-inspired, brightly colored, heavily patterned fleece zip-ups are incredibly popular among younger demographics. Additionally, the push for circular fashion has made recycled polyester fleece a standard in sustainable winter collections across all price points.'
  },
  tweed: {
    slug: 'tweed',
    name: 'Tweed',
    heroDescription: 'A rugged, closely woven woolen fabric celebrated for its complex color patterns, exceptional durability, and deep ties to British country heritage. Tweed is the ultimate intersection of utility and timeless style.',
    howItsMade: 'Tweed is woven from rough, heavily spun woolen yarns. The defining characteristic of tweed is its color complexity; the wool is often dyed in various earthy shades and mixed together before spinning, resulting in a yarn flecked with multiple colors. It is typically woven in twill, herringbone, or houndstooth patterns. It is intentionally finished to be rough, dense, and slightly scratchy, designed specifically to withstand harsh weather.',
    whereItsMade: 'Tweed is synonymous with the British Isles. The most famous variant is Harris Tweed, which, by law, must be handwoven by islanders in the Outer Hebrides of Scotland using local virgin wool. Ireland is also famous for Donegal Tweed, known for its distinctive colorful flecks (nep) woven into the fabric.',
    history: 'Tweed originated in the 18th and 19th centuries in Scotland and Ireland as a heavy, weather-resistant fabric for farmers and outdoorsmen working in the harsh, damp climate. It caught the eye of the British aristocracy in the 19th century, who adopted it as the unofficial uniform for country sports like hunting and fishing. In the 1920s, Coco Chanel revolutionized fashion by incorporating tweed into women\'s haute couture, cementing its status in high fashion.',
    benefits: [
      'Incredibly durable and resistant to wear and tear',
      'Naturally weather-resistant, repelling wind and light rain',
      'Provides exceptional warmth in cold, damp conditions',
      'Visually striking with deep, complex color mixtures'
    ],
    useCases: [
      'Classic sport coats, blazers, and full winter suits',
      'Heavy outerwear and overcoats',
      'Traditional flat caps and winter headwear',
      'High-fashion women\'s jackets and skirts'
    ],
    fashionTrends: 'Tweed frequently resurfaces in fashion through the "Dark Academia" aesthetic and the continuous revival of heritage tailoring. Modern tailoring has seen a shift toward softer, lighter tweeds that maintain the visual texture of the fabric without the historical stiffness. In women\'s fashion, the cropped, boxy Chanel-style tweed jacket remains a timeless symbol of elegance, continuously reinterpreted by modern luxury houses.'
  }
};
