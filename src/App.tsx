import React, { useState, useEffect } from 'react';
import {
  BookingSubmission,
  CartItem,
  FavoriteItem,
  LumirCentralData,
  PageView,
  ServiceItem
} from './types';
import {
  loadCentralData,
  resetCentralDataToFactory,
  saveCentralData
} from './data/centralData';
import { Layout } from './components/Layout';
import {
  FullCatalogView,
  HomeView,
  SpecializedCategoryView
} from './components/CatalogViews';
import {
  BookingFlow,
  StatusTrackerView
} from './components/BookingFlow';
import {
  AboutView,
  ContactView,
  FaqView,
  PrivacyView,
  TermsView
} from './components/InfoPages';
import { AdminDashboard } from './components/AdminDashboard';
import { GalleryView } from './components/GalleryView';

export function App() {
  const [data, setData] = useState<LumirCentralData>(() => loadCentralData());
  const getInitialView = (): PageView => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const validViews: PageView[] = [
        'home',
        'catalog',
        'gallery',
        'mobile-photography',
        'kids-corner',
        'childcare',
        'wedding-support',
        'service-detail',
        'booking',
        'booking-status',
        'about',
        'faq',
        'privacy',
        'terms',
        'contact',
        'admin'
      ];
      if (validViews.includes(hash as PageView)) {
        return hash as PageView;
      }
    } catch {}
    return 'home';
  };

  const [currentView, setCurrentView] = useState<PageView>(getInitialView);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);

  // Sync hash with currentView
  const handleNavigate = (view: PageView) => {
    setCurrentView(view);
    if (view === 'home') {
      history.replaceState(null, '', window.location.pathname);
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const validViews: PageView[] = [
        'home',
        'catalog',
        'mobile-photography',
        'kids-corner',
        'childcare',
        'wedding-support',
        'service-detail',
        'booking',
        'booking-status',
        'about',
        'faq',
        'privacy',
        'terms',
        'contact',
        'admin'
      ];
      if (validViews.includes(hash as PageView)) {
        setCurrentView(hash as PageView);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Favorites / Wishlist State with local persistence
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem('lumir_favorites_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (serviceId: string, packageId?: string) => {
    const srv = data.services.find((s) => s.id === serviceId);
    if (!srv) return;
    const pkg = packageId ? srv.packages.find((p) => p.id === packageId) : undefined;
    const favId = `${serviceId}-${packageId || 'main'}`;

    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === favId);
      let updated: FavoriteItem[];
      if (exists) {
        updated = prev.filter((f) => f.id !== favId);
      } else {
        updated = [
          ...prev,
          {
            id: favId,
            serviceId: srv.id,
            serviceName: srv.name,
            packageId: pkg?.id,
            packageName: pkg?.name,
            categoryKey: srv.category,
            priceSar: pkg ? pkg.price : srv.basePrice,
            imageUrl: srv.imageUrl,
            addedAt: new Date().toISOString()
          }
        ];
      }
      try {
        localStorage.setItem('lumir_favorites_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      try {
        localStorage.setItem('lumir_favorites_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearFavorites = () => {
    setFavorites([]);
    try {
      localStorage.removeItem('lumir_favorites_v1');
    } catch {}
  };

  // Cart / Inquiries State with local persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('lumir_cart_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleAddToCart = (service: ServiceItem, packageItem?: any) => {
    const cartId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: CartItem = {
      id: cartId,
      serviceId: service.id,
      serviceName: service.name,
      categoryKey: service.category,
      packageId: packageItem?.id,
      packageName: packageItem?.name,
      priceSar: packageItem ? packageItem.price : service.basePrice,
      deliveryTimeframe:
        packageItem?.deliveryTimeframe ||
        (service.deliveryTimeframeHours ? `${service.deliveryTimeframeHours} ساعة` : undefined),
      durationHours: packageItem?.durationHours || service.minHours,
      imageUrl: service.imageUrl,
      addedAt: new Date().toISOString()
    };

    setCartItems((prev) => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem('lumir_cart_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem('lumir_cart_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('lumir_cart_v1');
    } catch {}
  };

  // Sync with server bootstrap data on load
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (!serverData) return;
        setData((prev) => {
          const merged: LumirCentralData = {
            ...prev,
            settings: serverData.settings || prev.settings,
            announcements: serverData.announcements || prev.announcements,
            sliderSettings: serverData.sliderSettings || prev.sliderSettings,
            banners: serverData.banners || prev.banners,
            services: serverData.services || prev.services,
            portfolio: serverData.portfolio || prev.portfolio,
            faqs: serverData.faqs || prev.faqs,
            cityCoverage: serverData.cityCoverage || prev.cityCoverage
          };
          saveCentralData(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  // Dynamic SEO page title
  useEffect(() => {
    const base = 'LUMIR | لومير — نضيء لياليك وفرحة صغارك';
    const titles: Record<PageView, string> = {
      home: `${base} | مكة المكرمة وجدة`,
      catalog: `كتالوج الخدمات والأسعار — ${base}`,
      gallery: `معرض الأعمال ونماذج التغطيات — ${base}`,
      'mobile-photography': `تصوير المناسبات بالجوال — ${base}`,
      'kids-corner': `ركن الأطفال والأنشطة — ${base}`,
      childcare: `مشرفات رعاية الأطفال — ${base}`,
      'wedding-support': `خدمات مساندة الأفراح — ${base}`,
      'service-detail': `تفاصيل الخدمة — ${base}`,
      booking: `طلب حجز موعد — ${base}`,
      'booking-status': `تتبع حالة الطلب — ${base}`,
      about: `من نحن — ${base}`,
      faq: `الأسئلة الشائعة — ${base}`,
      privacy: `سياسة الخصوصية — ${base}`,
      terms: `الشروط والأحكام — ${base}`,
      contact: `تواصلي معنا — ${base}`,
      admin: `لوحة الإدارة المركزية — ${base}`
    };
    document.title = titles[currentView] || base;
  }, [currentView]);

  const handleSelectServiceToBook = (serviceId: string, packageId?: string) => {
    setSelectedServiceId(serviceId);
    setSelectedPackageId(packageId);
    setCurrentView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingCreated = (submission: BookingSubmission) => {
    const updatedBookings = [
      submission,
      ...data.bookings.filter((b) => b.id !== submission.id)
    ];
    const updatedData: LumirCentralData = {
      ...data,
      bookings: updatedBookings
    };
    setData(updatedData);
    saveCentralData(updatedData);
  };

  const handleSaveData = (updated: LumirCentralData) => {
    setData(updated);
    saveCentralData(updated);
  };

  const handleResetToDefaults = () => {
    const fresh = resetCentralDataToFactory();
    setData(fresh);
  };

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        data={data}
        onSaveData={handleSaveData}
        onResetToDefaults={handleResetToDefaults}
        navigate={handleNavigate}
      />
    );
  }

  return (
    <Layout
      currentView={currentView}
      navigate={handleNavigate}
      settings={data.settings}
      announcements={data.announcements}
      services={data.services}
      bookings={data.bookings}
      favorites={favorites}
      onRemoveFavorite={handleRemoveFavorite}
      onClearFavorites={handleClearFavorites}
      cartItems={cartItems}
      onRemoveFromCart={handleRemoveFromCart}
      onClearCart={handleClearCart}
      onSelectServiceToBook={handleSelectServiceToBook}
    >
      {currentView === 'home' && (
        <HomeView
          services={data.services}
          settings={data.settings}
          banners={data.banners}
          sliderSettings={data.sliderSettings}
          portfolio={data.portfolio}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={handleNavigate}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'catalog' && (
        <FullCatalogView
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={handleNavigate}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'gallery' && (
        <GalleryView
          portfolio={data.portfolio}
          settings={data.settings}
          navigate={handleNavigate}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'mobile-photography' && (
        <SpecializedCategoryView
          categoryKey="mobile_photography"
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={setCurrentView}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'kids-corner' && (
        <SpecializedCategoryView
          categoryKey="kids_corner"
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={setCurrentView}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'childcare' && (
        <SpecializedCategoryView
          categoryKey="childcare"
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={setCurrentView}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'wedding-support' && (
        <SpecializedCategoryView
          categoryKey="wedding_support"
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={setCurrentView}
          onSelectServiceToBook={handleSelectServiceToBook}
        />
      )}

      {currentView === 'booking' && (
        <BookingFlow
          services={data.services}
          settings={data.settings}
          bookings={data.bookings}
          preselectedServiceId={selectedServiceId}
          preselectedPackageId={selectedPackageId}
          onBookingCreated={handleBookingCreated}
          navigate={handleNavigate}
        />
      )}

      {currentView === 'booking-status' && (
        <StatusTrackerView
          bookings={data.bookings}
          settings={data.settings}
          navigate={handleNavigate}
        />
      )}

      {currentView === 'about' && (
        <AboutView settings={data.settings} navigate={handleNavigate} />
      )}

      {currentView === 'faq' && <FaqView settings={data.settings} faqs={data.faqs} />}

      {currentView === 'privacy' && <PrivacyView settings={data.settings} />}

      {currentView === 'terms' && <TermsView settings={data.settings} />}

      {currentView === 'contact' && <ContactView settings={data.settings} />}
    </Layout>
  );
}

export default App;
