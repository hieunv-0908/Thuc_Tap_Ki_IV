import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
} from './mockData';
import { VALID_ORDER_TRANSITIONS } from '../../utils/constants';

const DB_KEY = 'funnyshop_mock_db';

class MockEngine {
  constructor() {
    this.loadDatabase();
  }

  loadDatabase() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.categories = parsed.categories || INITIAL_CATEGORIES;
        this.products = parsed.products || INITIAL_PRODUCTS;
        this.users = parsed.users || INITIAL_USERS;
        this.orders = parsed.orders || INITIAL_ORDERS;
        return;
      }
    } catch {
      // Fallback if localStorage parse fails
    }
    this.categories = [...INITIAL_CATEGORIES];
    this.products = [...INITIAL_PRODUCTS];
    this.users = [...INITIAL_USERS];
    this.orders = [...INITIAL_ORDERS];
    this.saveDatabase();
  }

  saveDatabase() {
    try {
      localStorage.setItem(
        DB_KEY,
        JSON.stringify({
          categories: this.categories,
          products: this.products,
          users: this.users,
          orders: this.orders,
        })
      );
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  resetDatabase() {
    this.categories = [...INITIAL_CATEGORIES];
    this.products = [...INITIAL_PRODUCTS];
    this.users = [...INITIAL_USERS];
    this.orders = [...INITIAL_ORDERS];
    this.saveDatabase();
  }

  async delay(minMs = 300, maxMs = 600) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- AUTH ---
  async register({ fullName, email, password }) {
    await this.delay();
    if (!fullName || !email || !password) {
      throw { status: 400, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' };
    }

    const existing = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw { status: 409, message: 'Email này đã được sử dụng bởi tài khoản khác.' };
    }

    const newUser = {
      id: Date.now(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'CUSTOMER',
    };

    this.users.push(newUser);
    this.saveDatabase();

    return { message: 'Đăng ký tài khoản thành công.' };
  }

  async login({ email, password }) {
    await this.delay();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password
    );

    if (!user) {
      throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  // --- USERS / PROFILE ---
  async getMe(userId) {
    await this.delay();
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw { status: 404, message: 'Người dùng không tồn tại.' };
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  async updateMe(userId, { fullName, email, password }) {
    await this.delay();
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw { status: 404, message: 'Người dùng không tồn tại.' };
    }

    // Check duplicate email
    if (email && email.toLowerCase() !== this.users[index].email.toLowerCase()) {
      const duplicate = this.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId
      );
      if (duplicate) {
        throw { status: 409, message: 'Email mới đã được sử dụng bởi tài khoản khác.' };
      }
    }

    this.users[index].fullName = fullName || this.users[index].fullName;
    if (email) this.users[index].email = email.toLowerCase();
    if (password) this.users[index].password = password;

    this.saveDatabase();

    return {
      id: this.users[index].id,
      fullName: this.users[index].fullName,
      email: this.users[index].email,
      role: this.users[index].role,
    };
  }

  // --- CATEGORIES ---
  async getCategories() {
    await this.delay(200, 400);
    return [...this.categories];
  }

  // --- PRODUCTS ---
  async getProducts({ q = '', categoryId = '', sort = '', page = 1, size = 8 } = {}) {
    await this.delay();
    let result = [...this.products];

    // Search query filter
    if (q && q.trim()) {
      const keyword = q.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          (p.description && p.description.toLowerCase().includes(keyword))
      );
    }

    // Category filter
    if (categoryId) {
      const catId = Number(categoryId);
      result = result.filter((p) => p.category?.id === catId);
    }

    // Sorting
    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'stock_desc') {
      result.sort((a, b) => b.stock - a.stock);
    } else if (sort === 'rating_desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: sort by id descending (newest)
      result.sort((a, b) => b.id - a.id);
    }

    const totalElements = result.length;
    const pageSize = Number(size) || 8;
    const currentPage = Math.max(1, Number(page) || 1);
    const totalPages = Math.ceil(totalElements / pageSize) || 1;

    const start = (currentPage - 1) * pageSize;
    const pagedContent = result.slice(start, start + pageSize);

    return {
      content: pagedContent,
      page: currentPage,
      totalPages,
      totalElements,
    };
  }

  async getProductById(id) {
    await this.delay();
    const product = this.products.find((p) => p.id === Number(id));
    if (!product) {
      throw { status: 404, message: 'Không tìm thấy sản phẩm yêu cầu.' };
    }
    return { ...product };
  }

  // --- ORDERS ---
  async createOrder(userId, { fullName, phone, address, items }) {
    await this.delay(400, 700);

    if (!fullName || !phone || !address || !items || !items.length) {
      throw { status: 400, message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng và sản phẩm.' };
    }

    // Validate stock and deduct
    for (const item of items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) {
        throw { status: 404, message: `Sản phẩm mã #${item.productId} không tồn tại.` };
      }
      if (product.stock < item.quantity) {
        throw {
          status: 400,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, không đủ số lượng đặt (${item.quantity}).`,
        };
      }
    }

    const createdAt = new Date();
    const datePart = [
      String(createdAt.getDate()).padStart(2, '0'),
      String(createdAt.getMonth() + 1).padStart(2, '0'),
      createdAt.getFullYear(),
    ].join('');
    const idPrefix = `DH${datePart}`;
    const availableSuffixes = Array.from({ length: 9000 }, (_, index) =>
      String(index + 1000)
    ).filter(
      (suffix) => !this.orders.some((order) => String(order.id) === `${idPrefix}${suffix}`)
    );

    if (availableSuffixes.length === 0) {
      throw { status: 409, message: 'Đã hết mã đơn hàng có thể tạo trong ngày hôm nay.' };
    }

    const orderId =
      idPrefix + availableSuffixes[Math.floor(Math.random() * availableSuffixes.length)];

    // Deduct stock
    const detailedItems = items.map((item) => {
      const product = this.products.find((p) => p.id === item.productId);
      product.stock -= item.quantity;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      };
    });

    const totalPrice = detailedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    const newOrder = {
      id: orderId,
      userId: userId || 2, // Default to customer if not given
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: 'PENDING',
      totalPrice,
      createdAt: createdAt.toISOString(),
      items: detailedItems,
    };

    this.orders.unshift(newOrder);
    this.saveDatabase();

    return newOrder;
  }

  async getMyOrders(userId) {
    await this.delay();
    const myOrders = this.orders.filter((o) => o.userId === userId);
    return [...myOrders];
  }

  async getOrderById(orderId) {
    await this.delay();
    const order = this.orders.find((o) => String(o.id) === String(orderId));
    if (!order) {
      throw { status: 404, message: 'Đơn hàng không tồn tại.' };
    }
    return { ...order };
  }

  // --- ADMIN: PRODUCTS ---
  async adminCreateProduct(data) {
    await this.delay();
    if (!data.name || !data.price || data.categoryId === undefined) {
      throw { status: 400, message: 'Vui lòng điền tên, giá và danh mục sản phẩm.' };
    }

    const category = this.categories.find((c) => c.id === Number(data.categoryId)) || {
      id: 1,
      name: 'Điện thoại & Phụ kiện',
    };

    const newProduct = {
      id: Date.now(),
      name: data.name.trim(),
      description: data.description || '',
      price: Number(data.price),
      stock: Number(data.stock) >= 0 ? Number(data.stock) : 0,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      rating: 5.0,
      category,
    };

    this.products.unshift(newProduct);
    this.saveDatabase();
    return newProduct;
  }

  async adminUpdateProduct(id, data) {
    await this.delay();
    const index = this.products.findIndex((p) => p.id === Number(id));
    if (index === -1) {
      throw { status: 404, message: 'Sản phẩm không tồn tại.' };
    }

    let category = this.products[index].category;
    if (data.categoryId) {
      category = this.categories.find((c) => c.id === Number(data.categoryId)) || category;
    }

    this.products[index] = {
      ...this.products[index],
      name: data.name ? data.name.trim() : this.products[index].name,
      description: data.description !== undefined ? data.description : this.products[index].description,
      price: data.price !== undefined ? Number(data.price) : this.products[index].price,
      stock: data.stock !== undefined ? Number(data.stock) : this.products[index].stock,
      imageUrl: data.imageUrl || this.products[index].imageUrl,
      category,
    };

    this.saveDatabase();
    return { ...this.products[index] };
  }

  async adminDeleteProduct(id) {
    await this.delay();
    const index = this.products.findIndex((p) => p.id === Number(id));
    if (index === -1) {
      throw { status: 404, message: 'Sản phẩm không tồn tại.' };
    }

    this.products.splice(index, 1);
    this.saveDatabase();
    return { message: 'Đã xóa sản phẩm thành công.' };
  }

  // --- ADMIN: ORDERS ---
  async adminGetAllOrders() {
    await this.delay();
    return [...this.orders];
  }

  async adminUpdateOrderStatus(orderId, newStatus) {
    await this.delay();
    const order = this.orders.find((o) => String(o.id) === String(orderId));
    if (!order) {
      throw { status: 404, message: 'Đơn hàng không tồn tại.' };
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw {
        status: 400,
        message: `Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}".`,
      };
    }

    order.status = newStatus;

    // If cancelled, restore stock!
    if (newStatus === 'CANCELLED' && order.items) {
      for (const item of order.items) {
        const prod = this.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
        }
      }
    }

    this.saveDatabase();
    return { ...order };
  }

  // --- AI INTEGRATION MOCKS ---
  async aiGenerateDescription(productName) {
    await this.delay(600, 1000);
    if (!productName || !productName.trim()) {
      throw { status: 400, message: 'Tên sản phẩm không được để trống.' };
    }

    const sampleDescriptions = [
      `🌟 **${productName}** – Kiệt tác thiết kế đem lại phong cách sống trẻ trung và tiện lợi vượt trội. Sản phẩm được hoàn thiện từ vật liệu cao cấp, độ bền tối ưu và phù hợp với mọi nhu cầu hàng ngày của bạn. Đặt hàng ngay hôm nay tại FunnyShop để nhận ưu đãi hấp dẫn!`,
      `✨ Nâng tầm trải nghiệm với **${productName}** độc quyền tại FunnyShop! Với thiết kế tinh tế, tính năng vượt trội cùng tính ứng dụng thực tế cao, đây chắc chắn là sự lựa chọn hoàn hảo dành cho bạn và người thân.`,
      `🔥 Siêu phẩm hot nhất mùa này: **${productName}**! Thiết kế bắt mắt, đường nét sắc sảo, công năng linh hoạt giúp cuộc sống của bạn trở nên thú vị và tiện nghi hơn bao giờ hết.`,
    ];

    const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);
    return {
      description: sampleDescriptions[randomIndex],
    };
  }

  async aiGenerateMockProducts(count = 5) {
    await this.delay(800, 1200);
    const mockTitles = [
      { name: 'Kẹp tóc hình mầm cây phát sáng thần kỳ', catId: 2, price: 45000, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
      { name: 'Gối tựa lưng công thái học hạt bọt biển', catId: 4, price: 290000, img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600' },
      { name: 'Dây sạc nhanh Type-C phát quang chống rối', catId: 1, price: 85000, img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600' },
      { name: 'Móc khóa Capybara biết thổi bong bóng xà phòng', catId: 3, price: 69000, img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600' },
      { name: 'Bộ sticker trang trí mèo lười Meme chống nước 50 cái', catId: 5, price: 35000, img: 'https://images.unsplash.com/photo-1585336261026-41846cbbe0bd?w=600' },
    ];

    const generated = [];
    const targetCount = Math.min(count, mockTitles.length);

    for (let i = 0; i < targetCount; i++) {
      const item = mockTitles[i];
      const cat = this.categories.find((c) => c.id === item.catId) || this.categories[0];
      const newProd = {
        id: Date.now() + i,
        name: item.name,
        description: `Sản phẩm mẫu sinh tự động bởi Funny AI: ${item.name}. Chất lượng chuẩn xuất khẩu, thiết kế độc đáo.`,
        price: item.price,
        stock: Math.floor(Math.random() * 30) + 10,
        imageUrl: item.img,
        rating: 4.8,
        category: cat,
      };
      this.products.unshift(newProd);
      generated.push(newProd);
    }

    this.saveDatabase();
    return generated;
  }

  async aiChat(message) {
    await this.delay(600, 1100);
    const msg = (message || '').toLowerCase();

    // Recommend products based on message keywords
    let recommendedProducts;
    if (msg.includes('tai nghe') || msg.includes('điện thoại') || msg.includes('phụ kiện')) {
      recommendedProducts = this.products.filter((p) => p.category?.id === 1).slice(0, 3);
    } else if (msg.includes('áo') || msg.includes('thời trang') || msg.includes('mũ') || msg.includes('kính')) {
      recommendedProducts = this.products.filter((p) => p.category?.id === 2).slice(0, 3);
    } else if (msg.includes('đồ chơi') || msg.includes('quà') || msg.includes('gối') || msg.includes('hài hước')) {
      recommendedProducts = this.products.filter((p) => p.category?.id === 3).slice(0, 3);
    } else if (msg.includes('đèn') || msg.includes('gia dụng') || msg.includes('cốc') || msg.includes('tinh dầu')) {
      recommendedProducts = this.products.filter((p) => p.category?.id === 4).slice(0, 3);
    } else if (msg.includes('sách') || msg.includes('bút') || msg.includes('sổ')) {
      recommendedProducts = this.products.filter((p) => p.category?.id === 5).slice(0, 3);
    } else {
      // Default recommended top products
      recommendedProducts = this.products.slice(0, 2);
    }

    let reply = `Chào bạn! FunnyShop có rất nhiều món đồ thú vị và tiện ích. Dưới đây là một số gợi ý phù hợp nhất dành cho bạn:`;
    if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi')) {
      reply = `Xin chào! Tôi là Trợ lý AI FunnyShop. Rất vui được hỗ trợ bạn tìm kiếm món đồ ưng ý hôm nay. Bạn đang tìm đồ chơi quà tặng, phụ kiện công nghệ hay thời trang nào?`;
    } else if (msg.includes('giá') || msg.includes('bao nhiêu')) {
      reply = `Mọi sản phẩm của FunnyShop đều có giá niêm yết rõ ràng kèm chính sách thanh toán khi nhận hàng (COD) cực kỳ an tâm! Bạn có thể xem các mẫu nổi bật sau:`;
    }

    return {
      reply,
      products: recommendedProducts,
    };
  }
}

export const mockEngine = new MockEngine();
