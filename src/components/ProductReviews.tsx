'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified?: boolean;
}

export default function ProductReviews({ productSlug, productTitle }: { productSlug: string; productTitle: string }) {
  const { user } = useUser();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const storageKey = `ogba_reviews_${productSlug}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReviews(JSON.parse(saved));
      }
    } catch {
      // ignore storage failure
    }
  }, [storageKey]);

  useEffect(() => {
    if (user?.fullName && !authorName) {
      setAuthorName(user.fullName);
    }
  }, [user?.fullName, authorName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: authorName.trim() || 'Verified Ogba Shopper',
      rating,
      comment: comment.trim(),
      createdAt: new Date().toLocaleDateString(),
      verified: Boolean(user),
    };

    const next = [newReview, ...reviews];
    setReviews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage failure
    }
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <section
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        padding: '1.5rem',
        marginBottom: '2.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <MessageSquare size={18} color="var(--primary-green)" />
          <span>Customer Reviews ({reviews.length})</span>
        </h2>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Rate {productTitle}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} stars`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: star <= rating ? '#F59E0B' : '#CBD5E1' }}
            >
              <Star size={20} fill={star <= rating ? '#F59E0B' : 'none'} />
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
          <input
            id="review-author"
            name="authorName"
            type="text"
            placeholder="Your Name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.84rem', background: '#FFFFFF' }}
          />
          <textarea
            id="review-comment"
            name="comment"
            rows={2}
            required
            placeholder="Share your experience with this product or vendor..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.84rem', background: '#FFFFFF', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.65rem' }}>
          <button
            type="submit"
            style={{ background: 'var(--primary-green)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.5rem 1.15rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Submit Review
          </button>
          {submitted && (
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Review posted!
            </span>
          )}
        </div>
      </form>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
          No customer reviews yet. Be the first to review this item!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reviews.map((rev) => (
            <div key={rev.id} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{rev.author}</strong>
                  {rev.verified && (
                    <span style={{ fontSize: '0.68rem', background: '#ECFDF5', color: '#059669', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>
                      Verified User
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rev.createdAt}</span>
              </div>
              <div style={{ display: 'flex', gap: '2px', color: '#F59E0B', marginBottom: '0.3rem' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} fill={s <= rev.rating ? '#F59E0B' : 'none'} />
                ))}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

