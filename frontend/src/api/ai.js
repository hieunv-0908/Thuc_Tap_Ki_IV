import apiClient from './axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';

// Danh sách sản phẩm dự phòng nếu không kết nối được API backend
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: 'Áo Polo Nam Classic Cotton Cool',
    price: 299000,
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop',
    categoryName: 'Thời trang Nam',
  },
  {
    id: 10,
    name: 'Áo Sơ Mi Nam Công Sở',
    price: 299000,
    imageUrl: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8iO_byH5gLlB8U9H4k7vILDQloQgy8zDmSNzLA0Mb186sLQ4nc4haLPVqasnCPrJh8LKgYuWPsJAVyOHCAbr7yRxnDhxNBgh22yl7N8kKIbLMVOYrH8-wfg&usqp=CAc',
    categoryName: 'Thời trang Nam',
  },
  {
    id: 2,
    name: 'Quần Jeans Nam Slim Fit Denim',
    price: 499000,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop',
    categoryName: 'Thời trang Nam',
  },
  {
    id: 3,
    name: 'Đầm Midi Nữ Thiết Kế Cổ V',
    price: 550000,
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop',
    categoryName: 'Thời trang Nữ',
  },
  {
    id: 4,
    name: 'Áo Blazer Nữ Công Sở Hàn Quốc',
    price: 680000,
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop',
    categoryName: 'Thời trang Nữ',
  },
  {
    id: 5,
    name: 'Áo Hoodie Unisex Oversize Form Rộng',
    price: 380000,
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop',
    categoryName: 'Unisex & Phụ kiện',
  },
];

let cachedLiveProducts = null;
let lastLiveFetch = 0;

/**
 * Tải danh mục sản phẩm động từ Database / API thật của FunnyShop.
 * Bất cứ khi nào admin thêm, sửa, cập nhật sản phẩm, AI sẽ tự động biết đến.
 */
export async function getLiveCatalog() {
  const now = Date.now();
  if (cachedLiveProducts && now - lastLiveFetch < 30000) {
    return cachedLiveProducts;
  }

  try {
    const res = await apiClient.get('/api/v1/products', { params: { size: 100 } });
    const content = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : []);
    if (Array.isArray(content) && content.length > 0) {
      cachedLiveProducts = content.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        imageUrl:
          p.imageUrl ||
          (p.images && p.images[0]?.imageUrl) ||
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',
        categoryName: p.category?.name || 'Thời trang',
        stock: p.stockQuantity ?? 10,
        variants: p.variants || [],
        description: p.description || '',
      }));
      lastLiveFetch = now;
      return cachedLiveProducts;
    }
  } catch (err) {
    console.warn('[AI] Không thể lấy sản phẩm trực tiếp từ API, dùng dữ liệu dự phòng:', err);
  }

  return cachedLiveProducts || FALLBACK_PRODUCTS;
}

// Bóc tách toàn bộ thông tin đơn hàng nếu khách hàng gửi tin nhắn xác nhận đầy đủ
export function parseFullOrderMessage(text, liveProducts) {
  if (!text || typeof text !== 'string') return null;

  // 1. Họ tên người nhận
  const nameMatch = text.match(/(?:Họ\s*(?:và|&)?\s*tên(?:\s*người\s*nhận)?|Tên\s*người\s*nhận|Người\s*nhận)\s*[:：-]\s*([^\r\n,]+)/i);
  // 2. Số điện thoại
  const phoneMatch = text.match(/(?:Số\s*điện\s*thoại|SĐT|SDT|Điện\s*thoại|Phone)\s*[:：-]\s*([0-9+\s.]{9,15})/i);
  // 3. Địa chỉ nhận hàng
  const addrMatch = text.match(/(?:Địa\s*chỉ(?:\s*nhận\s*hàng)?|Đ\/c)\s*[:：-]\s*([^\r\n]+)/i);

  if (!nameMatch || !phoneMatch || !addrMatch) {
    return null;
  }

  const fullName = nameMatch[1].trim();
  const phone = phoneMatch[1].replace(/[^0-9+]/g, '').trim();
  const address = addrMatch[1].trim();

  // 4. Phương thức thanh toán
  let paymentMethod = 'COD';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('payos') || lowerText.includes('vietqr') || lowerText.includes('chuyển khoản') || lowerText.includes('ngân hàng')) {
    paymentMethod = 'PAYOS';
  }

  // 5. Trích xuất danh sách sản phẩm & số lượng
  const itemRegex = /(?:^|\n)\s*([^:\r\n–-]+?)(?:[–-].*?)?Số\s*lượng\s*[:：-]?\s*(\d+)/gi;
  let match;
  const items = [];
  const foundProducts = [];

  while ((match = itemRegex.exec(text)) !== null) {
    const rawItemName = match[1].trim().toLowerCase();
    const quantity = parseInt(match[2], 10) || 1;

    let target = null;
    for (const p of liveProducts) {
      const pNameLower = p.name.toLowerCase();
      if (rawItemName.includes(pNameLower) || pNameLower.includes(rawItemName)) {
        target = p;
        break;
      }
    }

    if (!target) {
      if (rawItemName.includes('polo')) target = liveProducts.find((p) => p.name.toLowerCase().includes('polo'));
      else if (rawItemName.includes('sơ mi') || rawItemName.includes('so mi')) target = liveProducts.find((p) => p.name.toLowerCase().includes('sơ mi'));
      else if (rawItemName.includes('jean') || rawItemName.includes('quần')) target = liveProducts.find((p) => p.name.toLowerCase().includes('jean'));
      else if (rawItemName.includes('đầm') || rawItemName.includes('váy')) target = liveProducts.find((p) => p.name.toLowerCase().includes('đầm') || p.name.toLowerCase().includes('váy'));
      else if (rawItemName.includes('blazer')) target = liveProducts.find((p) => p.name.toLowerCase().includes('blazer'));
      else if (rawItemName.includes('thun') || rawItemName.includes('hoodie') || rawItemName.includes('oversize')) {
        target = liveProducts.find((p) => p.name.toLowerCase().includes('hoodie') || p.name.toLowerCase().includes('polo') || p.name.toLowerCase().includes('thun'));
      }
    }

    if (target) {
      const resolvedVariantId = target.variantId || (target.variants && target.variants[0]?.id) || null;
      items.push({
        productId: target.id,
        variantId: resolvedVariantId,
        quantity,
      });
      foundProducts.push({
        ...target,
        orderQuantity: quantity,
      });
    }
  }

  // Nếu không khớp regex theo dòng nhưng nhắc đến các sản phẩm trong văn bản
  if (items.length === 0) {
    for (const p of liveProducts) {
      const pNameLower = p.name.toLowerCase();
      if (lowerText.includes(pNameLower) || (pNameLower.includes('polo') && lowerText.includes('polo')) || (pNameLower.includes('jean') && lowerText.includes('jean'))) {
        items.push({
          productId: p.id,
          variantId: p.variantId || (p.variants && p.variants[0]?.id) || null,
          quantity: 1,
        });
        foundProducts.push({ ...p, orderQuantity: 1 });
        if (items.length >= 2) break;
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  return {
    fullName,
    phone,
    address,
    paymentMethod,
    items,
    foundProducts,
  };
}

// Nhận diện lời chào đơn giản để phản hồi tự nhiên, không gợi ý sản phẩm lung tung
function isSimpleGreeting(text) {
  const clean = (text || '').trim().toLowerCase();
  const greetings = [
    'alo', 'alô', 'chào', 'chào bạn', 'chào shop', 'hi', 'hello', 'hey',
    'ê', 'shop ơi', 'bạn ơi', 'ad ơi', 'có ai không', 'cho mình hỏi',
    'alo shop', 'chào bạn nha'
  ];
  return greetings.includes(clean);
}

// Nhận diện ý định muốn đặt hàng / mua hàng của khách (CHỈ khớp khi có tên hoặc đặc điểm sản phẩm cụ thể)
function detectOrderIntent(text, products) {
  const clean = (text || '').trim().toLowerCase();

  // Các câu nói chung chung chưa có sản phẩm cụ thể -> Không được tự động mở đặt hàng
  const genericOrderPhrases = [
    'tôi muốn đặt hàng', 'mình muốn đặt hàng', 'đặt hàng', 'mua hàng',
    'cho mình đặt hàng', 'cho tôi đặt hàng', 'cho đặt hàng', 'tôi muốn mua',
    'mình muốn mua', 'cho mình mua', 'tôi muốn mua đồ', 'mình muốn mua đồ',
    'mua đồ', 'đặt đồ', 'mua sản phẩm', 'đặt đơn', 'mua', 'đặt'
  ];
  if (genericOrderPhrases.some((phrase) => clean === phrase)) {
    return null;
  }

  const orderKeywords = [
    'đặt hàng', 'mua hàng', 'mua ngay', 'đặt mua', 'chốt đơn',
    'mua áo', 'mua quần', 'mua đầm', 'mua cái', 'mua em',
    'lấy 1 cái', 'lấy một cái', 'lấy cái này', 'lấy em này', 'cho mình đặt',
    'cho tôi đặt', 'cho em đặt', 'cho mình lấy', 'tôi muốn mua', 'mình muốn mua',
    'tôi muốn đặt', 'mình muốn đặt', 'ship cho mình', 'ship cho tôi'
  ];

  const hasOrderWord = orderKeywords.some((kw) => clean.includes(kw));
  if (!hasOrderWord) return null;

  // Tìm sản phẩm khớp chính xác hoặc khớp từ khóa trong tên
  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    const words = nameLower.split(/\s+/).filter((w) => w.length > 2);
    if (clean.includes(nameLower)) return p;
    const matchCount = words.filter((w) => clean.includes(w)).length;
    if (matchCount >= 2) return p;
  }

  // Khớp theo loại trang phục cụ thể nếu khách nói rõ
  if (clean.includes('polo')) return products.find((p) => p.name.toLowerCase().includes('polo')) || null;
  if (clean.includes('sơ mi') || clean.includes('so mi')) return products.find((p) => p.name.toLowerCase().includes('sơ mi')) || null;
  if (clean.includes('jean') || clean.includes('quần')) return products.find((p) => p.name.toLowerCase().includes('jean')) || null;
  if (clean.includes('đầm') || clean.includes('váy')) return products.find((p) => p.name.toLowerCase().includes('đầm') || p.name.toLowerCase().includes('váy')) || null;
  if (clean.includes('blazer')) return products.find((p) => p.name.toLowerCase().includes('blazer')) || null;
  if (clean.includes('hoodie')) return products.find((p) => p.name.toLowerCase().includes('hoodie')) || null;

  return null;
}

async function getLocalFashionFallback(message) {
  const clean = (message || '').trim().toLowerCase();
  const liveProducts = await getLiveCatalog();

  if (isSimpleGreeting(clean)) {
    return {
      reply: 'Dạ em chào bạn nha! Em là Stylist tư vấn của FunnyShop đây ạ 👋\nMình đang cần tìm đồ đi làm, đi dạo phố hay chuẩn bị đi tiệc thế ạ? Cứ nhắn cho em để em tư vấn set đồ ưng ý nhất cho mình nhé! 👔👗',
      products: [],
    };
  }

  if (clean.includes('ship') || clean.includes('giao hàng') || clean.includes('vận chuyển')) {
    return {
      reply: 'Dạ bên em ship hàng toàn quốc chỉ từ 2 - 4 ngày thôi ạ! Khi nhận hàng mình được đồng kiểm, mở ra xem ưng ý rồi mới thanh toán (COD), hoặc quét mã VietQR PayOS siêu tiện lợi luôn nha bạn! 🚚',
      products: [],
    };
  }

  if (clean.includes('đổi trả') || clean.includes('size') || clean.includes('đổi size') || clean.includes('bảng size') || clean.includes('chiều cao') || clean.includes('cân nặng')) {
    return {
      reply: 'Dạ bạn cứ nhắn cho em chiều cao và cân nặng (ví dụ: cao 1m70 nặng 65kg) là em bắt size chuẩn chỉnh cho mình luôn nha! Nếu lỡ mặc chưa vừa thì bên em hỗ trợ đổi size tận nơi trong 7 ngày hoàn toàn yên tâm ạ ❤️',
      products: [],
    };
  }

  // Khách nói muốn đặt hàng chung chung mà chưa rõ sản phẩm -> Hỏi lại, gợi ý vài mẫu để khách chọn
  const genericOrderPhrases = [
    'tôi muốn đặt hàng', 'mình muốn đặt hàng', 'đặt hàng', 'mua hàng',
    'cho mình đặt hàng', 'cho tôi đặt hàng', 'cho đặt hàng', 'tôi muốn mua',
    'mình muốn mua', 'cho mình mua', 'tôi muốn mua đồ', 'mình muốn mua đồ',
    'mua đồ', 'đặt đồ', 'mua sản phẩm', 'đặt đơn', 'mua', 'đặt'
  ];
  if (genericOrderPhrases.some((phrase) => clean === phrase)) {
    return {
      reply: 'Dạ em hỗ trợ lên đơn cho mình ngay đây ạ! Bạn đang muốn chốt mẫu nào của shop thế ạ (ví dụ: áo polo, sơ mi, quần jeans hay đầm midi)? Bạn nhắn em tên sản phẩm để em giữ hàng và tạo đơn ngay cho mình nha! 🛍️',
      products: liveProducts.slice(0, 3),
      isOrderIntent: false,
    };
  }

  const orderTarget = detectOrderIntent(message, liveProducts);
  if (orderTarget) {
    return {
      reply: `Dạ bạn muốn đặt sản phẩm **${orderTarget.name}** (Giá: ${orderTarget.price.toLocaleString('vi-VN')} VNĐ) đúng không ạ? Bạn có thể bấm nút **Đặt mua ngay** bên dưới hoặc điền nhanh thông tin nhận hàng bên dưới để shop giao cho bạn nhé! 🛍️`,
      products: [orderTarget],
      isOrderIntent: true,
      targetProduct: orderTarget,
    };
  }

  // Khớp sản phẩm và câu trả lời chi tiết theo từng nhu cầu thời trang cụ thể
  let matched = [];
  let customReply = '';

  if (clean.includes('nam') || clean.includes('đồ nam') || clean.includes('áo nam') || clean.includes('quần nam')) {
    customReply = 'Dạ em hiểu nhu cầu của mình rồi nè! Đồ nam bên em thiết kế phom dáng trẻ trung, vải cotton thoáng mát và cực kỳ tôn dáng. Em gửi bạn xem mấy mẫu polo và sơ mi đang được chuộng nhất bên em nha: ✨';
    matched = liveProducts.filter((p) => {
      const cat = (p.categoryName || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('nam') || name.includes('nam') || name.includes('polo') || name.includes('sơ mi') || name.includes('jean');
    });
  } else if (clean.includes('nữ') || clean.includes('đồ nữ') || clean.includes('áo nữ') || clean.includes('váy') || clean.includes('đầm')) {
    customReply = 'Dạ đây nè bạn ơi! Các mẫu đầm midi và blazer nữ nhà em lên phom nhẹ nhàng, thanh lịch mà tôn dáng lắm luôn. Em gửi bạn xem thử mấy mẫu xinh xắn này nhé: 👗✨';
    matched = liveProducts.filter((p) => {
      const cat = (p.categoryName || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('nữ') || name.includes('nữ') || name.includes('đầm') || name.includes('váy') || name.includes('blazer');
    });
  } else if (clean.includes('công sở') || clean.includes('đi làm') || clean.includes('lịch sự') || clean.includes('formal')) {
    customReply = 'Dạ đi làm thì ưu tiên hàng đầu là vừa chỉn chu, lịch sự mà mặc cả ngày vẫn phải thoải mái đúng không nè? Em gợi ý cho mình mấy mẫu sơ mi, polo và blazer dễ phối nhất này nha: 💼';
    matched = liveProducts.filter((p) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('sơ mi') || name.includes('blazer') || name.includes('polo') || name.includes('công sở');
    });
  } else if (clean.includes('phối đồ') || clean.includes('mix') || clean.includes('kết hợp') || clean.includes('mặc với')) {
    customReply = 'Dạ em mách nhỏ bí quyết phối đồ cực tôn dáng nè: Bạn thử mix áo polo/sơ mi với chiếc quần jeans ống đứng, bên ngoài khoác thêm blazer là có ngay outfit vừa thanh lịch vừa phong cách đi làm hay đi cà phê đều đẹp nha!';
    matched = liveProducts.slice(0, 3);
  } else if (clean.includes('giá rẻ') || clean.includes('rẻ nhất') || clean.includes('tiết kiệm') || clean.includes('giá tốt') || clean.includes('sale') || clean.includes('khuyến mãi')) {
    customReply = 'Dạ có ngay ạ! Đây là những mẫu giá cực kỳ yêu thương bên em nhưng chất vải vẫn rất xịn mịn và bền đẹp. Bạn xem thử mấy mẫu giá tốt này nhé:';
    matched = [...liveProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (clean.includes('mới nhất') || clean.includes('xu hướng') || clean.includes('trend') || clean.includes('hot')) {
    customReply = 'Dạ đây là những mẫu hot hit mới cập bến nhà em được nhiều bạn trẻ săn đón nhất tuần này nè! Em gửi bạn tham khảo nha: 🔥';
    matched = [...liveProducts].sort((a, b) => (b.id || 0) - (a.id || 0));
  } else if (clean.includes('polo')) {
    customReply = 'Dạ áo Polo bên em làm từ chất vải Cotton Cool co giãn 4 chiều, thấm hút mồ hôi siêu tốt mặc mùa này mát rượi luôn nè bạn:';
    matched = liveProducts.filter((p) => p.name.toLowerCase().includes('polo'));
  } else if (clean.includes('sơ mi') || clean.includes('so mi')) {
    customReply = 'Dạ các mẫu Áo Sơ Mi nhà FunnyShop phom dáng may đo chuẩn, cổ áo đứng phom và ít nhăn, mặc đi làm hay đi gặp khách hàng bao sang luôn ạ:';
    matched = liveProducts.filter((p) => p.name.toLowerCase().includes('sơ mi') || p.name.toLowerCase().includes('so mi'));
  } else if (clean.includes('jean') || clean.includes('quần')) {
    customReply = 'Dạ quần jeans bên em chất denim dày dặn vừa phải, co giãn nhẹ và tôn dáng cực kỳ. Em gửi bạn xem thử mẫu bán chạy nhất nha:';
    matched = liveProducts.filter((p) => p.name.toLowerCase().includes('jean') || p.name.toLowerCase().includes('quần'));
  } else if (clean.includes('blazer')) {
    customReply = 'Dạ áo Blazer bên em phom Hàn Quốc trẻ trung, đệm vai tinh tế giúp tôn dáng cực kỳ sang chảnh khi đi làm hoặc đi tiệc ạ:';
    matched = liveProducts.filter((p) => p.name.toLowerCase().includes('blazer'));
  } else if (clean.includes('hoodie') || clean.includes('unisex')) {
    customReply = 'Dạ các mẫu Áo Hoodie và đồ Unisex nhà em phom rộng giấu dáng cực chất, chất nỉ bông dày dặn ấm áp mặc đi chơi chụp hình bao đẹp luôn:';
    matched = liveProducts.filter((p) => p.name.toLowerCase().includes('hoodie') || (p.categoryName || '').toLowerCase().includes('unisex'));
  } else if (clean.includes('tôi muốn') || clean.includes('tôi đang cần') || clean.includes('mình đang cần') || clean.includes('đang cần') || clean.includes('cần tìm')) {
    customReply = 'Dạ em đây ạ! Bạn đang cần tìm đồ để đi làm, đi chơi hay đi tiệc thế ạ? Cứ chia sẻ với em phong cách bạn thích hoặc dáng người để em lựa set đồ chuẩn nhất cho mình nhé! 👕👗';
    matched = liveProducts.slice(0, 3);
  } else {
    customReply = 'Dạ em hiểu nhu cầu của mình rồi nè! Để em gửi bạn tham khảo trước mấy mẫu thời trang đang được yêu thích nhất bên em nha. Bạn thích phong cách nào cứ bảo em nhé: ❤️';
    matched = liveProducts.slice(0, 3);
  }

  const finalProducts = matched && matched.length > 0 ? matched.slice(0, 3) : liveProducts.slice(0, 3);

  return {
    reply: customReply,
    products: finalProducts,
  };
}

async function callDirectGemini(message) {
  const cleanMsg = (message || '').trim();
  const liveProducts = await getLiveCatalog();

  // Lời chào đơn giản -> Không gọi Gemini, phản hồi tức thì
  if (isSimpleGreeting(cleanMsg)) {
    return {
      reply: 'Dạ FunnyShop xin chào bạn! Mình là Trợ lý AI tư vấn thời trang của FunnyShop. Bạn đang quan tâm đến trang phục thời trang nam, thời trang nữ hay áo hoodie/phụ kiện hôm nay ạ? 👔👗',
      products: [],
    };
  }

  // Nếu không cấu hình API Key trên client, chuyển sang chế độ fallback cục bộ
  if (!GEMINI_API_KEY) {
    return getLocalFashionFallback(cleanMsg);
  }

  const catalogStr = liveProducts
    .map((p) => `- ID: ${p.id} | ${p.name} | Giá: ${p.price.toLocaleString('vi-VN')} VNĐ | Danh mục: ${p.categoryName}`)
    .join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `BẠN LÀ MỘT STYLIST KIÊM CHUYÊN VIÊN TƯ VẤN BÁN HÀNG THỜI TRANG BẰNG XƯƠNG BẰNG THỊT CỦA FUNNYSHOP.
Bạn đang nhắn tin trực tiếp với khách hàng trên khung chat trực tuyến (như Zalo / Messenger / Instagram của shop).

PHONG CÁCH GIAO TIẾP (BẮT BUỘC TỰ NHIÊN NHƯ NGƯỜI THẬT 100%):
- Xưng hô: Ấm áp, lễ phép, gần gũi (Dạ em chào anh/chị/bạn nha, dạ mẫu này mặc lên tôn dáng lắm ạ, để em chọn mẫu ưng ý nhất cho mình nhé...). Tuyệt đối không dùng văn phong robot hay khuôn sáo.
- Đồng cảm & Hiểu ý: Khi khách nói các câu tự nhiên như "tôi muốn...", "tôi đang cần...", "mình đang cần...", "đang cần...", "tư vấn giúp...", hãy đồng cảm và phản hồi ngay nhu cầu (ví dụ: 'Dạ em hiểu rồi ạ! Nếu mình đang cần đồ đi làm...', 'Dạ bên em có mấy mẫu này phom tôn dáng cực kỳ nè bạn!').
- Tư vấn có gu: Nêu ngắn gọn lý do vì sao nên chọn (chất liệu mát, phom đứng, phối đồ đẹp, che khuyết điểm...).
- Độ dài: 2 - 4 câu tự nhiên như một tin nhắn chat thật.

DANH MỤC SẢN PHẨM HIỆN CÓ TẠI SHOP (Dữ liệu thực tế từ hệ thống):
${catalogStr}

QUY TẮC BẮT BUỘC:
1. ĐÚNG DANH MỤC & ĐỐI TƯỢNG:
   - Khi khách hỏi/cần đồ nam ('thời trang nam', 'đồ nam', 'áo nam', 'quần nam', 'đang cần đồ nam'): CHỈ tư vấn và gợi ý sản phẩm thời trang Nam. Tuyệt đối không gợi ý đầm, váy hay đồ nữ.
   - Khi khách hỏi/cần đồ nữ ('thời trang nữ', 'đồ nữ', 'váy', 'đầm', 'đang cần đồ nữ'): CHỈ tư vấn sản phẩm thời trang Nữ.
   - Khi khách hỏi về phối đồ hoặc đồ công sở, hãy gợi ý kết hợp phù hợp (áo sơ mi/polo + quần jeans hoặc blazer).
   - Khi khách hỏi sản phẩm giá rẻ/tiết kiệm: Hãy ưu tiên gợi ý các sản phẩm có mức giá thấp nhất.
   - CHỈ tư vấn sản phẩm có trong danh mục trên. TUYỆT ĐỐI KHÔNG bịa ra sản phẩm khác.
2. HỖ TRỢ ĐẶT HÀNG:
   - NẾU KHÁCH NÓI CHUNG CHUNG: ví dụ "tôi muốn đặt hàng", "mua hàng", "cho mình đặt đơn", "mua đồ" mà CHƯA NÊU RÕ SẢN PHẨM NÀO:
     Hãy hỏi lại khách muốn mua sản phẩm cụ thể nào trong shop (áo polo, sơ mi, quần jeans, đầm midi hay áo blazer...). TUYỆT ĐỐI KHÔNG tự chọn một sản phẩm thay cho khách và TUYỆT ĐỐI KHÔNG ghi dòng ORDER_TARGET_ID.
   - CHỈ KHI KHÁCH NÓI RÕ TÊN HOẶC LOẠI SẢN PHẨM MUỐN MUA (ví dụ: "tôi muốn mua áo polo này", "đặt cho tôi áo sơ mi", "chốt đơn cái đầm này"):
     Lúc đó mới xác nhận sản phẩm, báo giá và kết thúc bằng:
     ORDER_TARGET_ID: [id]
     RECOMMENDED_PRODUCT_IDS: [id]
3. TƯ VẤN SẢN PHẨM:
   - Khi khách hỏi tìm đồ hoặc nhờ gợi ý, hãy tư vấn ngắn gọn, ấm áp (2-4 câu) và đặt dòng:
     RECOMMENDED_PRODUCT_IDS: [id1, id2] (tối đa 2-3 sản phẩm từ danh mục trên).
4. KHÁCH CHỈ CHÀO HỎI: Không đính kèm ID sản phẩm nào.
5. CHÍNH SÁCH: Giao hàng toàn quốc 2-4 ngày, đồng kiểm trước khi nhận (COD) hoặc thanh toán VietQR qua PayOS, đổi trả/đổi size trong 7 ngày.

Khách hàng hỏi: ${cleanMsg}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status}`);
  }

  const data = await res.json();
  const rawText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Dạ, FunnyShop có thể hỗ trợ gì về trang phục thời trang cho bạn ạ?';

  let cleanReply = rawText;
  let recommendedProducts = [];
  let isOrderIntent = false;
  let targetProduct = null;

  // Kiểm tra ORDER_TARGET_ID
  const orderTargetRegex = /ORDER_TARGET_ID:\s*\[(.*?)\]/i;
  const orderMatch = rawText.match(orderTargetRegex);
  if (orderMatch) {
    cleanReply = cleanReply.replace(orderTargetRegex, '').trim();
    const targetId = parseInt(orderMatch[1].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(targetId)) {
      targetProduct = liveProducts.find((p) => p.id === targetId);
      if (targetProduct) {
        isOrderIntent = true;
      }
    }
  }

  // Bóc tách RECOMMENDED_PRODUCT_IDS
  const idRegex = /RECOMMENDED_PRODUCT_IDS:\s*\[(.*?)\]/i;
  const match = cleanReply.match(idRegex);
  if (match) {
    cleanReply = cleanReply.replace(idRegex, '').trim();
    const ids = match[1]
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.replace(/[^0-9]/g, ''), 10))
      .filter((n) => !isNaN(n));

    recommendedProducts = liveProducts.filter((p) => ids.includes(p.id));
  }

  // Bổ sung phát hiện ý định đặt hàng nếu prompt chưa gắn cờ
  if (!isOrderIntent) {
    const fallbackTarget = detectOrderIntent(cleanMsg, liveProducts);
    if (fallbackTarget) {
      isOrderIntent = true;
      targetProduct = fallbackTarget;
      if (!recommendedProducts.some((p) => p.id === fallbackTarget.id)) {
        recommendedProducts.unshift(fallbackTarget);
      }
    }
  }

  return {
    reply: cleanReply,
    products: recommendedProducts,
    isOrderIntent,
    targetProduct,
  };
}

export const aiApi = {
  generateDescription: async (productName) => {
    try {
      return await apiClient.post('/api/admin/ai/description', { productName });
    } catch {
      return {
        description: `Sản phẩm thời trang ${productName} cao cấp tại FunnyShop. Thiết kế hiện đại, chất liệu thoáng mát, tôn dáng và bền màu.`,
      };
    }
  },

  generateMockProducts: async (count = 5) => {
    try {
      return await apiClient.post('/api/admin/ai/mock-products', { count });
    } catch {
      const live = await getLiveCatalog();
      return live.slice(0, count);
    }
  },

  chat: async (message) => {
    // 0. Kiểm tra nếu tin nhắn là xác nhận đặt hàng với đầy đủ Họ tên, SĐT, Địa chỉ, Sản phẩm
    const liveProducts = await getLiveCatalog();
    const parsedOrder = parseFullOrderMessage(message, liveProducts);
    if (parsedOrder) {
      return {
        isAutoOrder: true,
        orderPayload: {
          fullName: parsedOrder.fullName,
          phone: parsedOrder.phone,
          address: parsedOrder.address,
          paymentMethod: parsedOrder.paymentMethod,
          items: parsedOrder.items,
        },
        parsedOrder,
        products: parsedOrder.foundProducts,
      };
    }

    // 1. Thử gọi Backend Spring Boot trước nếu endpoint sẵn sàng
    try {
      const res = await apiClient.post('/api/chat', { message });
      const data = res?.data || res;
      if (data && (data.reply || data.products)) {
        const cleanMsg = (message || '').toLowerCase();
        const isFashionInquiry = cleanMsg.includes('nam') || cleanMsg.includes('nữ') || cleanMsg.includes('áo') ||
          cleanMsg.includes('quần') || cleanMsg.includes('thời trang') || cleanMsg.includes('gợi ý') ||
          cleanMsg.includes('tìm hiểu') || cleanMsg.includes('polo') || cleanMsg.includes('sơ mi') ||
          cleanMsg.includes('jean') || cleanMsg.includes('đầm') || cleanMsg.includes('váy') ||
          cleanMsg.includes('công sở') || cleanMsg.includes('giá') || cleanMsg.includes('phối đồ');

        // Nếu người dùng hỏi thời trang nhưng backend trả về lời chào xã giao do bản backend cũ chưa cập nhật
        const isBackendFalseGreeting = isFashionInquiry && (
          data.reply?.includes('Trợ lý AI tư vấn thời trang') ||
          data.reply?.includes('Bạn đang quan tâm đến trang phục') ||
          data.reply?.includes('bạn đang cần tìm kiếm')
        );

        if (!isBackendFalseGreeting) {
          // Bổ sung sản phẩm nếu backend trả về danh sách rỗng khi khách hỏi đồ
          if (isFashionInquiry && (!data.products || data.products.length === 0)) {
            const localFallback = await getLocalFashionFallback(message);
            data.products = localFallback.products || [];
            if (!data.reply || data.reply.includes('nổi bật')) {
              data.reply = localFallback.reply;
            }
          }

          const orderTarget = detectOrderIntent(message, liveProducts);
          if (orderTarget && !data.isOrderIntent) {
            data.isOrderIntent = true;
            data.targetProduct = orderTarget;
          }
          return data;
        }
      }
    } catch {
      // Backend chưa có endpoint (hoặc server staging chưa deploy bản mới)
    }

    // 2. Fallback gọi trực tiếp Google AI Studio với Gemini API Key
    try {
      return await callDirectGemini(message);
    } catch {
      // 3. Fallback thời trang chuẩn theo dữ liệu FunnyShop
      return await getLocalFashionFallback(message);
    }
  },
};
