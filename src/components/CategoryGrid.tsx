'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  ChevronRight
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
  }, [categoriesList]);

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
            onClick={() => onSelectCategory('all')}
          >
            All ({categoriesList.length})
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
          onClick={() => onSelectCategory('all')}
        >
          <div className="glider-bubble">
            <Layers size={18} />
          </div>
          <span className="glider-name">All Items</span>
        </button>

        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              className={`glider-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.slug)}
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
