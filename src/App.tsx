import React, { useState, useEffect } from 'react';
import {
  BookingSubmission,
  CartItem,
  CustomerReview,
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
import { ServiceDetailView } from './components/ServiceDetailView';
import { ServiceRatingModal } from './components/ServiceRatingModal';
import { NotFoundView } from './components/NotFoundView';
import { parseRoute, pathForView } from './utils/routes';
import { applySeoToDocument } from './utils/seoDocument';

export function App() {
  const [data, setData] = useState<LumirCentralData>(() => loadCentralData());
  const initialRoute = parseRoute(window.location.pathname, window.location.hash);
  const [currentView, setCurrentView] = useState<PageView>(initialRoute.view);
  const [currentSlug, setCurrentSlug] = useState<string | undefined>(initialRoute.slug);
  const [routeNotFound, setRouteNotFound] = useState<boolean>(Boolean(initialRoute.notFound));
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);

  // Customer Service Rating Modal State
  const [ratingModalOpen, setRatingModalOpen] = useState<boolean>(false);
  const [ratingModalServiceId, setRatingModalServiceId] = useState<string | undefined>(undefined);
  const [ratingModalBooking, setRatingModalBooking] = useState<BookingSubmission | null>(null);

  const handleOpenRatingModal = (serviceId?: string, booking?: BookingSubmission) => {
    setRatingModalServiceId(serviceId);
    setRatingModalBooking(booking || null);
    setRatingModalOpen(true);
  };

  const handleReviewSubmitted = (newReview: CustomerReview) => {
    setData((prev) => {
      const existing = prev.reviews || [];
      const updated = [newReview, ...existing.filter((r) => r.id !== newReview.id)];
      const next = { ...prev, reviews: updated };
      saveCentralData(next);
      return next;
    });
  };

  // Path-based routing: every view has its own crawlable URL (/products, /services/...)
  const handleNavigate = (view: PageView, slug?: string) => {
    const path = pathForView(view, slug);
    if (window.location.pathname !== path) {
      history.pushState({ view, slug }, '', path);
    }
    setCurrentView(view);
    setCurrentSlug(slug);
    setRouteNotFound(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Rewrite legacy #hash links to their canonical path without a history entry
    if (window.location.hash && window.location.hash.length > 1) {
      const legacy = parseRoute(window.location.pathname, window.location.hash);
      if (!legacy.notFound) history.replaceState(null, '', legacy.path);
    }

    const applyLocation = () => {
      const route = parseRoute(window.location.pathname, window.location.hash);
      setCurrentView(route.view);
      setCurrentSlug(route.slug);
      setRouteNotFound(Boolean(route.notFound));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', applyLocation);
    window.addEventListener('hashchange', applyLocation);
    return () => {
      window.removeEventListener('popstate', applyLocation);
      window.removeEventListener('hashchange', applyLocation);
    };
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

  // Per-page SEO: unique title, meta description, canonical, social tags and JSON-LD
  useEffect(() => {
    const path =
      currentView === 'not-found' || routeNotFound
        ? window.location.pathname
        : pathForView(currentView, currentSlug);
    applySeoToDocument(path);
  }, [currentView, currentSlug, routeNotFound]);

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
    <>
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
      onOpenRatingModal={handleOpenRatingModal}
    >
      {currentView === 'not-found' && <NotFoundView navigate={handleNavigate} />}

      {currentView === 'service-detail' && currentSlug && (
        <ServiceDetailView
          slug={currentSlug}
          services={data.services}
          settings={data.settings}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          navigate={handleNavigate}
          onSelectServiceToBook={handleSelectServiceToBook}
          onOpenRatingModal={() => {
            const srv = data.services.find((s) => s.slug === currentSlug);
            handleOpenRatingModal(srv?.id);
          }}
        />
      )}

      {currentView === 'home' && (
        <HomeView
          services={data.services}
          settings={data.settings}
          banners={data.banners}
          sliderSettings={data.sliderSettings}
          portfolio={data.portfolio}
          faqs={data.faqs}
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
          navigate={handleNavigate}
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
          navigate={handleNavigate}
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
          navigate={handleNavigate}
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
          navigate={handleNavigate}
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
          onRateBooking={(bk) => handleOpenRatingModal(bk.serviceId, bk)}
        />
      )}

      {currentView === 'booking-status' && (
        <StatusTrackerView
          bookings={data.bookings}
          settings={data.settings}
          navigate={handleNavigate}
          onRateBooking={(bk) => handleOpenRatingModal(bk.serviceId, bk)}
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

    {/* Dedicated Customer Service Rating Modal */}
    <ServiceRatingModal
      isOpen={ratingModalOpen}
      onClose={() => setRatingModalOpen(false)}
      services={data.services}
      preselectedServiceId={ratingModalServiceId}
      preselectedBooking={ratingModalBooking}
      onReviewSubmitted={handleReviewSubmitted}
    />
  </>
  );
}

export default App;
