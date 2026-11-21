'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  BatteryCharging,
  Smartphone,
  Shirt,
  Sparkles,
  Tv,
  Home,
  HeartPulse,
  Laptop,
  ShoppingBag,
  Trees,
  Car,
  Dumbbell,
  Gamepad2,
  Baby,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle
} from 'lucide-react';
import { Category } from '@/types/marketplace';
import { getCategories } from '@/actions/categories';

interface CategoryGridProps {
  categories?: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryGrid({ categories: initialCategories, selectedCategory, onSelectCategory }: CategoryGridProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories || []);
  const [shuffleTick, setShuffleTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    async function load() {
      if (!initialCategories || initialCategories.length === 0) {
        const live = await getCategories();
        if (live && live.length > 0) {
          setCategoriesList(live);
        }
      }
    }
    load();
  }, [initialCategories]);

  // Dynamic Popularity Sorting & Shuffle:
  // Prioritizes departments with the most product views and opens,
  // while rotating unviewed departments so the catalog stays dynamic.
  const sortedCategories = useMemo(() => {
    if (!categoriesList || categoriesList.length === 0) return [];

    let localViews: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ogba_category_views');
        if (stored) localViews = JSON.parse(stored);
      } catch (e) {}
    }

    const scored = categoriesList.map((cat: any) => {
      const dbViews = Number(cat.totalViews) || 0;
      const clientViews = Number(localViews[cat.slug]) || 0;
      const count = Number(cat.itemCount) || 0;
      // Weight product views heavily, along with user category opens
      const score = (dbViews * 4) + (clientViews * 3) + (count > 0 ? 1 : 0);
      return { ...cat, score };
    });

    const popular = scored.filter((c: any) => c.score > 0);
    const unviewed = scored.filter((c: any) => c.score === 0);

    // Sort popular by score descending
    popular.sort((a: any, b: any) => b.score - a.score);

    // Dynamic rotational shuffle for neutral/unviewed departments
    const shuffledUnviewed = [...unviewed].sort(() => 0.5 - Math.random());

    return [...popular, ...shuffledUnviewed];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesList, shuffleTick]);

  const handleManualShuffle = () => {
    setShuffleTick((prev) => prev + 1);
  };

  const handleSelect = (slug: string) => {
    if (slug !== 'all' && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ogba_category_views');
        const viewsMap = stored ? JSON.parse(stored) : {};
        viewsMap[slug] = (viewsMap[slug] || 0) + 1;
        localStorage.setItem('ogba_category_views', JSON.stringify(viewsMap));
      } catch (e) {}
    }
    onSelectCategory(slug);
  };

  // Check scroll position to update arrow visibility
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [sortedCategories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const size = 18;
    switch (iconName) {
      case 'BatteryCharging': return <BatteryCharging size={size} />;
      case 'Smartphone': return <Smartphone size={size} />;
      case 'Shirt': return <Shirt size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Tv': return <Tv size={size} />;
      case 'Home': return <Home size={size} />;
      case 'HeartPulse': return <HeartPulse size={size} />;
      case 'Laptop': return <Laptop size={size} />;
      case 'ShoppingBag': return <ShoppingBag size={size} />;
      case 'Trees': return <Trees size={size} />;
      case 'Car': return <Car size={size} />;
      case 'Dumbbell': return <Dumbbell size={size} />;
      case 'Gamepad2': return <Gamepad2 size={size} />;
      case 'Baby': return <Baby size={size} />;
      default: return <Layers size={size} />;
    }
  };

  return (
    <section className="category-glider-section">
      <div className="category-glider-header">
        <div className="category-glider-title-wrap">
          <span className="category-glider-pill">Explore</span>
          <h2 className="category-glider-title">Departments</h2>
        </div>

        <div className="category-glider-controls">
          <button
            type="button"
            className="category-view-all-btn"
            onClick={handleManualShuffle}
            title="Shuffle Departments"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
          >
            <Shuffle size={13} />
            <span>Shuffle</span>
          </button>
          <button
            type="button"
            className={`glider-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={`glider-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="category-view-all-btn"
            onClick={() => handleSelect('all')}
          >
            All ({sortedCategories.length})
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="category-glider-track"
        onScroll={checkScroll}
      >
        {/* All Departments Chip */}
        <button
          type="button"
          className={`glider-card ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleSelect('all')}
        >
          <div className="glider-bubble">
            <Layers size={18} />
          </div>
          <span className="glider-name">All Items</span>
        </button>

        {sortedCategories.map((cat: any) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              className={`glider-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelect(cat.slug)}
            >
              <div className="glider-bubble">
                {getCategoryIcon(cat.iconName)}
              </div>
              <span className="glider-name">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
