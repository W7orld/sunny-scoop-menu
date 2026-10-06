(function () {
  "use strict";

  const state = {
    locale: "ar",
    data: null,
    loadFailed: false,
    records: [],
    activeResult: -1,
    renderedResults: [],
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highlightTimer: null,
    scrollSpy: null,
  };

  const elements = {
    menuRoot: document.getElementById("menu-root"),
    menuState: document.getElementById("menu-state"),
    categoryNav: document.getElementById("category-nav"),
    searchInput: document.getElementById("menu-search"),
    searchClear: document.getElementById("search-clear"),
    searchResults: document.getElementById("search-results"),
    searchStatus: document.getElementById("search-status"),
    brandName: document.getElementById("brand-name"),
    brandTagline: document.getElementById("brand-tagline"),
    brandLogo: document.getElementById("brand-logo"),
    footerBrandName: document.getElementById("footer-brand-name"),
    footerCopyrightBrand: document.getElementById("footer-copyright-brand"),
    languageToggle: document.getElementById("language-toggle"),
    languageToggleCode: document.getElementById("language-toggle-code"),
    languageToggleText: document.getElementById("language-toggle-text"),
    metaDescription: document.getElementById("meta-description"),
    contactList: document.getElementById("contact-list"),
    locationList: document.getElementById("location-list"),
  };

  const TRANSLATIONS = {
    ar: {
      metaDescription: "قائمة صني سكوب الرقمية — اكتشف الآيس كريم، الحلويات، القهوة والمشروبات.",
      skipLink: "انتقل إلى القائمة",
      menuLabel: "قائمة رقمية",
      heroEyebrow: "لحظتك ألذّ معنا",
      searchLabel: "ماذا تشتهي اليوم؟",
      searchPlaceholder: "ابحث عن منتج",
      clearSearch: "مسح البحث",
      searchHelp: "اكتب اسم المنتج ثم استخدم السهمين للتنقل واضغط مفتاح الإدخال للانتقال إليه.",
      categoriesAria: "أقسام القائمة",
      categoriesTitle: "الأقسام",
      introKicker: "اختر مزاجك",
      introTitle: "لحظتك الحلوة تبدأ من هنا",
      loading: "جارٍ تحضير القائمة…",
      footerHeadline: "نكهة حلوة، ووقت أحلى.",
      contactTitle: "تواصل معنا",
      locationsTitle: "مواقعنا",
      backTop: "العودة للأعلى",
      logoAlt: "شعار صني سكوب",
      switchText: "English",
      switchCode: "EN",
      switchAria: "Switch to English",
      documentTitle: function (brand) { return brand + " — القائمة الرقمية"; },
      brandFallback: "صني سكوب",
      taglineFallback: "مغارف حلوة وأيام مشمسة",
      sectionFallback: "قسم القائمة",
      currency: "ر.ع",
      variantContainer: "خيارات نوع الكوب والأسعار",
      variantQuantity: "خيارات الكمية والأسعار",
      variantSize: "خيارات الحجم والأسعار",
      variantPrice: "السعر",
      variantOptions: "الخيارات والأسعار",
      emptyFamily: "تفاصيل المنتجات قريبًا",
      dataError: "تعذّر تحميل بيانات القائمة. يرجى إعادة تحميل الصفحة.",
      noMatches: "لا توجد نتائج مطابقة",
      noResults: "لا توجد نتائج",
      resultsAvailable: function (count) {
        if (count === 1) return "نتيجة واحدة متاحة";
        if (count === 2) return "نتيجتان متاحتان";
        return count + " نتائج متاحة";
      },
    },
    en: {
      metaDescription: "Sunny Scoop digital menu — discover ice cream, desserts, coffee, and refreshing drinks.",
      skipLink: "Skip to menu",
      menuLabel: "Digital menu",
      heroEyebrow: "Your moment tastes better with us",
      searchLabel: "What are you craving today?",
      searchPlaceholder: "Search for a product",
      clearSearch: "Clear search",
      searchHelp: "Type a product name, use the arrow keys to browse, then press Enter to jump to it.",
      categoriesAria: "Menu categories",
      categoriesTitle: "Categories",
      introKicker: "Choose your mood",
      introTitle: "Your sweet moment starts here",
      loading: "Preparing the menu…",
      footerHeadline: "Sweet flavors, happier moments.",
      contactTitle: "Contact us",
      locationsTitle: "Our locations",
      backTop: "Back to top",
      logoAlt: "Sunny Scoop logo",
      switchText: "العربية",
      switchCode: "AR",
      switchAria: "التبديل إلى العربية",
      documentTitle: function (brand) { return brand + " — Digital Menu"; },
      brandFallback: "Sunny Scoop",
      taglineFallback: "Sweet scoops, sunny days",
      sectionFallback: "Menu section",
      currency: "OMR",
      variantContainer: "Cup type and price options",
      variantQuantity: "Quantity and price options",
      variantSize: "Size and price options",
      variantPrice: "Price",
      variantOptions: "Options and prices",
      emptyFamily: "Product details coming soon",
      dataError: "The menu data could not be loaded. Please reload the page.",
      noMatches: "No matching results",
      noResults: "No results",
      resultsAvailable: function (count) {
        return count === 1 ? "1 result available" : count + " results available";
      },
    },
  };

  function text(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback || "";
    return String(value);
  }

  function t(key) {
    const values = Array.prototype.slice.call(arguments, 1);
    const translation = TRANSLATIONS[state.locale][key];
    return typeof translation === "function" ? translation.apply(null, values) : text(translation, key);
  }

  function localizedValue(source, key, fallback) {
    const currentSuffix = state.locale === "ar" ? "Ar" : "En";
    const alternateSuffix = state.locale === "ar" ? "En" : "Ar";
    const item = source && typeof source === "object" ? source : {};
    return text(item[key + currentSuffix], text(item[key + alternateSuffix], fallback));
  }

  function localizedName(item, fallback) {
    return localizedValue(item, "name", fallback || t("sectionFallback"));
  }

  function localizedVariantLabel(variant) {
    return state.locale === "ar"
      ? text(variant.labelAr, variant.labelEn)
      : text(variant.labelEn, variant.labelAr);
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>'"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[character];
    });
  }

  function safeId(value, fallback) {
    const normalized = text(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function normalizeSearch(value) {
    return text(value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
      .replace(/ـ/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
      .trim();
  }

  function normalizedSize(size) {
    if (!size) return { ar: "", en: "" };
    if (typeof size === "string" || typeof size === "number") {
      const value = text(size);
      return /[\u0600-\u06ff]/.test(value)
        ? { ar: value, en: "" }
        : { ar: "", en: value };
    }
    if (typeof size === "object") {
      return {
        ar: text(size.ar || size.nameAr || size.labelAr),
        en: text(size.en || size.nameEn || size.labelEn),
      };
    }
    return { ar: "", en: "" };
  }

  function uniqueText(values) {
    const seen = new Set();
    return values.filter(function (value) {
      const key = normalizeSearch(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function bilingualKey(item) {
    return normalizeSearch(item.nameAr) + "|" + normalizeSearch(item.nameEn);
  }

  function commonId(ids) {
    if (ids.length < 2) return ids[0] || "product";
    const parts = ids.map(function (id) { return safeId(id).split("-"); });
    const shared = [];
    for (let index = 0; index < parts[0].length; index += 1) {
      const token = parts[0][index];
      if (!parts.every(function (idParts) { return idParts[index] === token; })) break;
      shared.push(token);
    }
    return shared.join("-") || ids[0];
  }

  function variantType(variants) {
    const labels = normalizeSearch(variants.map(function (variant) {
      return variant.labelAr + " " + variant.labelEn;
    }).join(" "));
    if (/\b(cup|paper|plastic)\b/.test(labels) || /كوب|ورقي|بلاستيكي/.test(labels)) {
      return "container";
    }
    if (/\d/.test(labels)) return "quantity";
    return labels ? "size" : "price";
  }

  function mergeProducts(products) {
    const grouped = new Map();

    products.forEach(function (product) {
      const key = bilingualKey(product);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: product.id,
          sourceIds: [],
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          image: product.image,
          aliases: [],
          variants: [],
        });
      }

      const merged = grouped.get(key);
      merged.sourceIds.push(product.id);
      merged.aliases = merged.aliases.concat(product.aliases);
      merged.variants.push({
        id: product.id,
        labelAr: product.size.ar,
        labelEn: product.size.en,
        price: product.price,
      });
    });

    return Array.from(grouped.values()).map(function (product) {
      const seenVariants = new Set();
      product.id = commonId(product.sourceIds);
      product.aliases = uniqueText(product.aliases);
      product.variants = product.variants.filter(function (variant) {
        const key = [
          normalizeSearch(variant.labelAr),
          normalizeSearch(variant.labelEn),
          variant.price,
        ].join("|");
        if (seenVariants.has(key)) return false;
        seenVariants.add(key);
        return true;
      });
      product.variantType = variantType(product.variants);
      product.variantSearch = product.variants.map(function (variant) {
        return [variant.labelAr, variant.labelEn, variant.price].join(" ");
      }).join(" ");
      return product;
    });
  }

  function mergeFamilies(families) {
    const grouped = new Map();

    families.forEach(function (family) {
      const key = bilingualKey(family);
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: family.id,
          sourceIds: [],
          nameAr: family.nameAr,
          nameEn: family.nameEn,
          notesAr: [],
          notesEn: [],
          products: [],
        });
      }

      const merged = grouped.get(key);
      merged.sourceIds.push(family.id);
      if (family.noteAr) merged.notesAr.push(family.noteAr);
      if (family.noteEn) merged.notesEn.push(family.noteEn);
      merged.products = merged.products.concat(family.products);
    });

    return Array.from(grouped.values()).map(function (family) {
      family.notesAr = uniqueText(family.notesAr);
      family.notesEn = uniqueText(family.notesEn);
      family.products = mergeProducts(family.products);
      return family;
    });
  }

  function normalizedData(rawData) {
    const raw = rawData && typeof rawData === "object" ? rawData : {};
    const sections = Array.isArray(raw.sections) ? raw.sections : [];

    return {
      brand: raw.brand && typeof raw.brand === "object" ? raw.brand : {},
      contact: raw.contact && typeof raw.contact === "object" ? raw.contact : {},
      locations: Array.isArray(raw.locations) ? raw.locations : [],
      sections: sections.map(function (section, sectionIndex) {
        const families = Array.isArray(section.families) ? section.families : [];
        const sectionId = safeId(section.id, "section-" + (sectionIndex + 1));

        return {
          id: sectionId,
          nameAr: text(section.nameAr, "قسم القائمة"),
          nameEn: text(section.nameEn, "Menu section"),
          families: mergeFamilies(families.map(function (family, familyIndex) {
            const products = Array.isArray(family.products) ? family.products : [];
            const familyId = safeId(family.id, sectionId + "-family-" + (familyIndex + 1));

            return {
              id: familyId,
              nameAr: text(family.nameAr, section.nameAr),
              nameEn: text(family.nameEn, section.nameEn),
              noteAr: text(family.noteAr),
              noteEn: text(family.noteEn),
              products: products.map(function (product, productIndex) {
                return {
                  id: safeId(product.id, familyId + "-product-" + (productIndex + 1)),
                  nameAr: text(product.nameAr, text(product.nameEn, "منتج")),
                  nameEn: text(product.nameEn),
                  price: text(product.price),
                  image: text(product.image),
                  size: normalizedSize(product.size),
                  aliases: Array.isArray(product.aliases)
                    ? product.aliases.map(function (alias) { return text(alias); })
                    : [],
                };
              }),
            };
          })),
        };
      }),
    };
  }

  function setElementText(element, value) {
    if (element) element.textContent = value;
  }

  function renderBrand(brand) {
    const name = localizedValue(brand, "name", t("brandFallback"));
    const tagline = localizedValue(brand, "tagline", t("taglineFallback"));
    const languageDirection = state.locale === "ar" ? "rtl" : "ltr";

    [elements.brandName, elements.footerBrandName, elements.footerCopyrightBrand].forEach(function (element) {
      setElementText(element, name);
      if (element) {
        element.lang = state.locale;
        element.dir = languageDirection;
      }
    });
    setElementText(elements.brandTagline, tagline);
    if (elements.brandTagline) {
      elements.brandTagline.lang = state.locale;
      elements.brandTagline.dir = languageDirection;
    }
    document.title = t("documentTitle", name);
  }

  const ICON_PATHS = {
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle class="dot" cx="17.4" cy="6.6" r="1.1" />',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.4 2.3 1.9 3.8 4.5 4" />',
    snapchat:
      '<path d="M12 3.5c-2.6 0-4 1.9-4 4.2V10c-.8.3-1.7.6-2.5.6.5.9 1.2 1.2 2 1.4-.4 1.2-1.4 2-2.5 2.6 1 .5 2 .6 2.9.9.3.6.6 1.3 1.4 1.3.9 0 1.4-.8 2.7-.8s1.8.8 2.7.8c.8 0 1.1-.7 1.4-1.3.9-.3 1.9-.4 2.9-.9-1.1-.6-2.1-1.4-2.5-2.6.8-.2 1.5-.5 2-1.4-.8 0-1.7-.3-2.5-.6V7.7c0-2.3-1.4-4.2-4-4.2Z" />',
    x: '<path d="M5 4l14 16M19 4 5 20" />',
    whatsapp:
      '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20Z" /><path d="M9.5 9c.3 2 2.5 4.2 4.5 4.5l1.2-1.2-1.8-1-.8.7c-.8-.3-1.7-1.1-2-2l.7-.8-1-1.8L9.5 9Z" />',
    facebook: '<path d="M14 8h2V5h-2.5A3.5 3.5 0 0 0 10 8.5V11H8v3h2v6h3v-6h2.3l.7-3H13V8.7c0-.4.3-.7 1-.7Z" />',
    phone:
      '<path d="M6 3h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3L15 11.5l4 1.5v3a2 2 0 0 1-2 2A13 13 0 0 1 4 5a2 2 0 0 1 2-2Z" />',
    link: '<circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17" />',
  };

  // Only plain web links or "#" placeholders are allowed in data-driven hrefs.
  function safeUrl(value) {
    const url = text(value).trim();
    return /^(https?:\/\/|tel:|#)/i.test(url) ? url : "#";
  }

  function footerLinkTemplate(href, iconName, label, options) {
    const external = href !== "#" && /^https?:/i.test(href);
    return (
      "<li>" +
      '<a href="' + escapeHtml(href) + '"' +
      (external ? ' target="_blank" rel="noreferrer"' : "") +
      ">" +
      '<span class="footer-link__label">' +
      (iconName
        ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON_PATHS[iconName] + "</svg>"
        : "") +
      '<span lang="' + escapeHtml(options.lang) + '" dir="' + escapeHtml(options.dir) + '">' +
      escapeHtml(label) +
      "</span></span>" +
      (external ? '<span aria-hidden="true">↗</span>' : "") +
      "</a></li>"
    );
  }

  function renderFooter(contact, locations) {
    const ltr = { lang: "en", dir: "ltr" };
    const localized = { lang: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" };

    if (elements.contactList) {
      const items = [];
      const phone = text(contact.phone);
      if (phone) {
        items.push(footerLinkTemplate("tel:" + phone.replace(/[^\d+]/g, ""), "phone", phone, ltr));
      }
      (Array.isArray(contact.socials) ? contact.socials : []).forEach(function (social) {
        const type = text(social.type).toLowerCase();
        const label = text(social.handle, type);
        if (!label) return;
        items.push(footerLinkTemplate(safeUrl(social.url), ICON_PATHS[type] ? type : "link", label, ltr));
      });
      elements.contactList.innerHTML = items.join("");
    }

    if (elements.locationList) {
      elements.locationList.innerHTML = locations.map(function (location) {
        const name = localizedValue(location, "name", "");
        return name ? footerLinkTemplate(safeUrl(location.url), "", name, localized) : "";
      }).join("");
    }
  }

  function priceTemplate(price) {
    if (!price) return '<span class="product-card__price"><small>—</small></span>';
    return (
      '<span class="product-card__price" dir="ltr">' +
      '<b dir="ltr">' + escapeHtml(price) + "</b>" +
      '<small lang="' + state.locale + '" dir="' + (state.locale === "ar" ? "rtl" : "ltr") + '">' +
      escapeHtml(t("currency")) + "</small>" +
      "</span>"
    );
  }

  function variantsTemplate(product) {
    const labelled = product.variants.some(function (variant) { return localizedVariantLabel(variant); });
    const labelByType = {
      container: t("variantContainer"),
      quantity: t("variantQuantity"),
      size: t("variantSize"),
      price: t("variantPrice"),
    };

    return (
      '<ul class="product-card__variants" aria-label="' +
      escapeHtml(labelByType[product.variantType] || t("variantOptions")) +
      '">' +
      product.variants.map(function (variant) {
        const label = localizedVariantLabel(variant);
        const variantLabel = label
          ? '<span class="product-card__size">' + escapeHtml(label) + "</span>"
          : '<span class="sr-only">' + escapeHtml(t("variantPrice")) + "</span>";
        return (
          '<li class="product-card__variant' + (labelled ? "" : " product-card__variant--price-only") + '">' +
          variantLabel +
          priceTemplate(variant.price) +
          "</li>"
        );
      }).join("") +
      "</ul>"
    );
  }

  function productTemplate(product, section, family) {
    const domId = "product-" + section.id + "-" + family.id + "-" + product.id;
    const nameId = domId + "-name";
    const photo = product.image;

    state.records.push({
      id: domId,
      product: product,
      section: section,
      family: family,
      searchable: normalizeSearch(
        [
          product.nameAr,
          product.nameEn,
          product.variantSearch,
          family.nameAr,
          family.nameEn,
          section.nameAr,
          section.nameEn,
        ].concat(product.aliases).join(" ")
      ),
    });

    return (
      '<article class="product-card" id="' +
      escapeHtml(domId) +
      '" tabindex="-1" data-product-id="' +
      escapeHtml(product.id) +
      '" aria-labelledby="' + escapeHtml(nameId) + '">' +
      '<figure class="product-card__media" aria-hidden="true">' +
      (photo
        ? '<img class="product-card__image" src="' + escapeHtml(photo) + '" alt="" loading="lazy" decoding="async" />'
        : "") +
      "</figure>" +
      '<div class="product-card__content">' +
      '<div class="product-card__names" id="' + escapeHtml(nameId) + '">' +
      '<strong class="product-card__ar" lang="ar" dir="rtl">' +
      escapeHtml(product.nameAr) +
      "</strong>" +
      (product.nameEn
        ? '<span class="product-card__en" lang="en" dir="ltr">' + escapeHtml(product.nameEn) + "</span>"
        : "") +
      "</div>" +
      variantsTemplate(product) +
      "</div>" +
      "</article>"
    );
  }

  function familyTemplate(family, section) {
    const products = family.products.length
      ? '<div class="product-grid">' +
        family.products.map(function (product) {
          return productTemplate(product, section, family);
        }).join("") +
        "</div>"
      : '<p class="empty-family">' + escapeHtml(t("emptyFamily")) + "</p>";

    const headingId = "family-heading-" + section.id + "-" + family.id;
    const notes = state.locale === "ar" ? family.notesAr : family.notesEn;
    const note = notes.length
      ? '<aside class="family-note">' +
        notes.map(function (noteText) {
          return '<strong>' + escapeHtml(noteText) + "</strong>";
        }).join("") +
        "</aside>"
      : "";

    return (
      '<article class="menu-family" id="family-' +
      escapeHtml(section.id + "-" + family.id) +
      '" aria-labelledby="' + escapeHtml(headingId) + '">' +
      '<header class="family-heading">' +
      '<h3 id="' + escapeHtml(headingId) + '">' +
      escapeHtml(localizedName(family)) +
      "</h3>" +
      "</header>" +
      '<div class="family-layout">' +
      products +
      "</div>" +
      note +
      "</article>"
    );
  }

  function sectionTemplate(section, index) {
    const number = String(index + 1).padStart(2, "0");
    return (
      '<section class="menu-section" id="section-' +
      escapeHtml(section.id) +
      '" aria-labelledby="heading-' +
      escapeHtml(section.id) +
      '">' +
      '<header class="section-heading">' +
      '<div class="section-heading__names">' +
      '<h2 id="heading-' +
      escapeHtml(section.id) +
      '">' +
      escapeHtml(localizedName(section)) +
      "</h2>" +
      "</div>" +
      '<span class="section-heading__number" aria-hidden="true">' +
      number +
      "</span>" +
      "</header>" +
      section.families.map(function (family) {
        return familyTemplate(family, section);
      }).join("") +
      "</section>"
    );
  }

  function navTemplate(section) {
    return (
      '<a class="category-link" href="#section-' +
      escapeHtml(section.id) +
      '" data-section="' +
      escapeHtml(section.id) +
      '">' +
      '<span class="category-link__label">' +
      escapeHtml(localizedName(section)) +
      "</span>" +
      "</a>"
    );
  }

  function renderMenu(data) {
    state.records = [];

    if (!data.sections.length) {
      elements.menuState.innerHTML =
        "<span>" + escapeHtml(t("dataError")) + "</span>";
      elements.menuState.hidden = false;
      return;
    }

    elements.categoryNav.innerHTML = data.sections.map(navTemplate).join("");
    elements.menuRoot.innerHTML = data.sections.map(sectionTemplate).join("");
    elements.menuState.hidden = true;
    bindImageFallbacks();
    setupScrollSpy();
  }

  function bindImageFallbacks() {
    elements.menuRoot.querySelectorAll(".product-card__media img").forEach(function (image) {
      function markMissing() {
        const figure = image.closest(".product-card__media");
        if (figure) figure.classList.add("is-missing");
        image.hidden = true;
      }

      image.addEventListener("error", markMissing, { once: true });
      if (image.complete && image.naturalWidth === 0) markMissing();
    });
  }

  function bindCategoryNavigation() {
    elements.categoryNav.addEventListener("click", function (event) {
      const link = event.target.closest(".category-link");
      if (!link) return;
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
    });
  }

  function setupScrollSpy() {
    if (state.scrollSpy) {
      state.scrollSpy.disconnect();
      state.scrollSpy = null;
    }
    if (!("IntersectionObserver" in window)) return;
    const links = Array.from(elements.categoryNav.querySelectorAll(".category-link"));
    const sections = Array.from(elements.menuRoot.querySelectorAll(".menu-section"));

    function activate(sectionId) {
      links.forEach(function (link) {
        const active = link.dataset.section === sectionId;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        const visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible.length) activate(visible[0].target.id.replace(/^section-/, ""));
      },
      { rootMargin: "-92px 0px -58%", threshold: [0, 0.08, 0.25] }
    );
    state.scrollSpy = observer;

    sections.forEach(function (section) { observer.observe(section); });
    if (sections[0]) activate(sections[0].id.replace(/^section-/, ""));
  }

  function scoreRecord(record, query) {
    const ar = normalizeSearch(record.product.nameAr);
    const en = normalizeSearch(record.product.nameEn);
    const aliases = normalizeSearch(record.product.aliases.join(" "));
    const variants = normalizeSearch(record.product.variantSearch);
    if (ar === query || en === query) return 0;
    if (ar.startsWith(query) || en.startsWith(query)) return 1;
    if (ar.includes(query) || en.includes(query)) return 2;
    if (aliases.includes(query) || variants.includes(query)) return 3;
    if (record.searchable.includes(query)) return 4;
    return 99;
  }

  function findMatches(query) {
    const normalized = normalizeSearch(query);
    if (!normalized) return [];
    return state.records
      .map(function (record) {
        return { record: record, score: scoreRecord(record, normalized) };
      })
      .filter(function (item) { return item.score < 99; })
      .sort(function (a, b) {
        if (a.score !== b.score) return a.score - b.score;
        const firstName = state.locale === "ar" ? a.record.product.nameAr : a.record.product.nameEn;
        const secondName = state.locale === "ar" ? b.record.product.nameAr : b.record.product.nameEn;
        return firstName.localeCompare(secondName, state.locale);
      })
      .slice(0, 9)
      .map(function (item) { return item.record; });
  }

  function resultTemplate(record, index) {
    const prices = uniqueText(record.product.variants.map(function (variant) {
      return variant.price;
    }));
    const numericPrices = prices.slice().sort(function (first, second) {
      return Number.parseFloat(first) - Number.parseFloat(second);
    });
    const priceText = numericPrices.length > 1
      ? numericPrices[0] + " – " + numericPrices[numericPrices.length - 1]
      : (numericPrices[0] || "—");
    const context = [
      record.product.nameEn
        ? '<span lang="en" dir="ltr">' + escapeHtml(record.product.nameEn) + "</span>"
        : "",
      '<span class="search-result__family">' + escapeHtml(localizedName(record.family)) + "</span>",
    ].filter(Boolean).join('<span aria-hidden="true"> · </span>');

    return (
      '<button class="search-result" id="search-option-' +
      index +
      '" type="button" role="option" tabindex="-1" aria-selected="false" data-index="' +
      index +
      '">' +
      '<span class="search-result__names">' +
      '<strong lang="ar" dir="rtl">' +
      escapeHtml(record.product.nameAr) +
      "</strong>" +
      '<span class="search-result__context">' + context + "</span>" +
      "</span>" +
      '<span class="search-result__price">' +
      '<b dir="ltr">' + escapeHtml(priceText) + "</b>" +
      ' <small lang="' + state.locale + '" dir="' + (state.locale === "ar" ? "rtl" : "ltr") + '">' +
      escapeHtml(t("currency")) + "</small></span>" +
      "</button>"
    );
  }

  function openResults() {
    elements.searchResults.hidden = false;
    elements.searchInput.setAttribute("aria-expanded", "true");
    document.body.classList.add("search-open");
  }

  function closeResults() {
    elements.searchResults.hidden = true;
    elements.searchInput.setAttribute("aria-expanded", "false");
    elements.searchInput.removeAttribute("aria-activedescendant");
    state.activeResult = -1;
    document.body.classList.remove("search-open");
  }

  function updateSearchClear() {
    elements.searchClear.hidden = elements.searchInput.value.length === 0;
  }

  function clearSearch() {
    elements.searchInput.value = "";
    renderSearchResults();
    elements.searchInput.focus();
  }

  function renderSearchResults() {
    updateSearchClear();
    const query = elements.searchInput.value;
    if (!normalizeSearch(query)) {
      state.renderedResults = [];
      elements.searchResults.innerHTML = "";
      elements.searchStatus.textContent = "";
      closeResults();
      return;
    }

    state.renderedResults = findMatches(query);
    state.activeResult = -1;
    elements.searchInput.removeAttribute("aria-activedescendant");

    if (!state.renderedResults.length) {
      elements.searchResults.innerHTML = '<p class="search-empty">' + escapeHtml(t("noMatches")) + "</p>";
      elements.searchStatus.textContent = t("noResults");
    } else {
      elements.searchResults.innerHTML = state.renderedResults.map(resultTemplate).join("");
      elements.searchStatus.textContent = t("resultsAvailable", state.renderedResults.length);
    }
    openResults();
  }

  function setActiveResult(index) {
    const options = Array.from(elements.searchResults.querySelectorAll(".search-result"));
    if (!options.length) return;
    state.activeResult = ((index % options.length) + options.length) % options.length;
    options.forEach(function (option, optionIndex) {
      const active = optionIndex === state.activeResult;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", active ? "true" : "false");
    });
    const activeOption = options[state.activeResult];
    elements.searchInput.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
  }

  function scrollToRecord(record) {
    if (!record) return;
    const target = document.getElementById(record.id);
    if (!target) return;

    elements.searchInput.value = record.product.nameAr +
      (record.product.nameEn ? " · " + record.product.nameEn : "");
    updateSearchClear();
    closeResults();
    target.scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "center" });

    if (state.highlightTimer) window.clearTimeout(state.highlightTimer);
    document.querySelectorAll(".product-card.is-highlighted").forEach(function (card) {
      card.classList.remove("is-highlighted");
    });
    target.classList.add("is-highlighted");
    window.setTimeout(function () {
      target.focus({ preventScroll: true });
    }, state.reducedMotion ? 0 : 420);
    state.highlightTimer = window.setTimeout(function () {
      target.classList.remove("is-highlighted");
    }, 2600);
  }

  function bindSearch() {
    let inputTimer;
    elements.searchInput.addEventListener("input", function () {
      updateSearchClear();
      window.clearTimeout(inputTimer);
      inputTimer = window.setTimeout(renderSearchResults, 70);
    });

    elements.searchClear.addEventListener("click", function () {
      window.clearTimeout(inputTimer);
      clearSearch();
    });

    elements.searchInput.addEventListener("focus", function () {
      if (normalizeSearch(elements.searchInput.value)) renderSearchResults();
    });

    elements.searchInput.addEventListener("keydown", function (event) {
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
        window.clearTimeout(inputTimer);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (elements.searchResults.hidden) renderSearchResults();
        setActiveResult(state.activeResult + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (elements.searchResults.hidden) renderSearchResults();
        const previousIndex = state.activeResult >= 0
          ? state.activeResult - 1
          : state.renderedResults.length - 1;
        setActiveResult(previousIndex);
      } else if (event.key === "Enter") {
        if (elements.searchResults.hidden) renderSearchResults();
        if (state.renderedResults.length) {
          event.preventDefault();
          const selectedIndex = state.activeResult >= 0 ? state.activeResult : 0;
          scrollToRecord(state.renderedResults[selectedIndex]);
        }
      } else if (event.key === "Escape") {
        closeResults();
      }
    });

    elements.searchResults.addEventListener("click", function (event) {
      const result = event.target.closest(".search-result");
      if (!result) return;
      scrollToRecord(state.renderedResults[Number(result.dataset.index)]);
    });

    document.addEventListener("pointerdown", function (event) {
      if (!event.target.closest(".search-panel")) {
        window.clearTimeout(inputTimer);
        closeResults();
      }
    });

    document.addEventListener("keydown", function (event) {
      const tagName = document.activeElement && document.activeElement.tagName;
      const typing = tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        elements.searchInput.focus();
        elements.searchInput.select();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        elements.searchInput.focus();
      }
    });
  }

  function applyStaticTranslations() {
    const documentElement = document.documentElement;
    const direction = state.locale === "ar" ? "rtl" : "ltr";
    const targetLocale = state.locale === "ar" ? "en" : "ar";

    documentElement.lang = state.locale;
    documentElement.dir = direction;
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (element) {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });

    elements.searchInput.placeholder = t("searchPlaceholder");
    if (elements.metaDescription) elements.metaDescription.content = t("metaDescription");
    if (elements.brandLogo) elements.brandLogo.alt = t("logoAlt");
    if (elements.languageToggle) {
      elements.languageToggle.setAttribute("aria-label", t("switchAria"));
      elements.languageToggle.lang = targetLocale;
      elements.languageToggle.dir = targetLocale === "ar" ? "rtl" : "ltr";
    }
    setElementText(elements.languageToggleCode, t("switchCode"));
    setElementText(elements.languageToggleText, t("switchText"));
    if (elements.languageToggleText) {
      elements.languageToggleText.lang = targetLocale;
      elements.languageToggleText.dir = targetLocale === "ar" ? "rtl" : "ltr";
    }
    document.title = t("documentTitle", t("brandFallback"));
  }

  function showDataError() {
    elements.categoryNav.innerHTML = "";
    elements.menuRoot.innerHTML = "";
    elements.menuState.innerHTML = "<span>" + escapeHtml(t("dataError")) + "</span>";
    elements.menuState.hidden = false;
  }

  function setLanguage(locale) {
    if (!Object.prototype.hasOwnProperty.call(TRANSLATIONS, locale)) return;
    state.locale = locale;
    applyStaticTranslations();

    if (state.data) {
      renderBrand(state.data.brand);
      renderFooter(state.data.contact, state.data.locations);
      renderMenu(state.data);
      state.renderedResults = [];
      elements.searchResults.innerHTML = "";
      elements.searchStatus.textContent = "";
      closeResults();
    } else if (state.loadFailed) {
      showDataError();
    }
  }

  function bindLanguageSwitch() {
    elements.languageToggle.addEventListener("click", function () {
      setLanguage(state.locale === "ar" ? "en" : "ar");
    });
  }

  async function loadMenuData() {
    const response = await fetch("./data/products.json", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Menu data request failed with status " + response.status);
    return response.json();
  }

  function localeFromUrl() {
    const requested = new URLSearchParams(window.location.search).get("lang");
    return requested && Object.prototype.hasOwnProperty.call(TRANSLATIONS, requested) ? requested : null;
  }

  async function init() {
    state.locale = localeFromUrl() || state.locale;
    applyStaticTranslations();
    bindLanguageSwitch();
    bindCategoryNavigation();
    bindSearch();
    updateSearchClear();
    setElementText(document.getElementById("current-year"), new Date().getFullYear());

    try {
      state.data = normalizedData(await loadMenuData());
      renderBrand(state.data.brand);
      renderFooter(state.data.contact, state.data.locations);
      renderMenu(state.data);
    } catch (error) {
      state.loadFailed = true;
      showDataError();
      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
