import Shop from "../models/Shop.js";

// GET /api/shop/profile
export const getShopProfile = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.auth.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/shop/profile
export const updateShopProfile = async (req, res, next) => {
  try {
    if (req.auth.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Only the shop owner can update the shop profile" });
    }

    const {
      name,
      phone,
      businessType,
      address,
      city,
      state,
      country,
      pincode,
      currency,
      timezone,
      preferredLanguage,
      shopLogo,
    } = req.body;

    // Validate required fields
    if (!name?.trim() || !phone?.trim() || !businessType?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shop Name, Phone Number, and Business Type are required",
      });
    }

    // Validate logo size if base64 data URL
    if (shopLogo && shopLogo.startsWith("data:")) {
      // rough estimation of byte size from base64 string
      const base64Content = shopLogo.split(",")[1];
      if (base64Content) {
        const sizeInBytes = Buffer.byteLength(base64Content, "base64");
        if (sizeInBytes > 2 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "Shop logo image exceeds the maximum size of 2 MB",
          });
        }
      }
    }

    const shop = await Shop.findById(req.auth.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // Update fields
    shop.name = name.trim();
    shop.phone = phone.trim();
    shop.businessType = businessType.trim();
    shop.address = address !== undefined ? address.trim() : shop.address;
    shop.city = city !== undefined ? city.trim() : shop.city;
    shop.state = state !== undefined ? state.trim() : shop.state;
    shop.country = country !== undefined ? country.trim() : shop.country;
    shop.pincode = pincode !== undefined ? pincode.trim() : shop.pincode;
    shop.currency = currency !== undefined ? currency.trim() : shop.currency;
    shop.timezone = timezone !== undefined ? timezone.trim() : shop.timezone;
    shop.preferredLanguage = preferredLanguage !== undefined ? preferredLanguage.trim() : shop.preferredLanguage;
    shop.shopLogo = shopLogo !== undefined ? shopLogo : shop.shopLogo;
    shop.profileCompleted = true;

    await shop.save();

    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    return next(error);
  }
};
