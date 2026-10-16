'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Megaphone } from 'lucide-react';
import { CommunityNotice } from '@/types/marketplace';
import { getCommunityNoticesAction } from '@/actions/communities';

export default function CommunityNoticeBoard() {
  const [notices, setNotices] = useState<CommunityNotice[]>([]);

  useEffect(() => {
    async function loadNotices() {
      try {
        const data = await getCommunityNoticesAction();
        if (data && data.length > 0) {
          setNotices(
            data.map((n: any) => ({
              id: n.id,
              title: n.title,
              date: n.published_at ? new Date(n.published_at).toLocaleDateString() : 'Today',
              category: n.category || 'Market Update',
              excerpt: n.excerpt || n.title,
            }))
          );
        }
      } catch (e) {
        console.error('Failed to load notices:', e);
      }
    }
    loadNotices();
  }, []);

  return (
    <div className="widget-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '8px', color: 'var(--primary-green)', display: 'flex' }}>
          <Megaphone size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Community Notice Board
          </h3>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Ogba & Egi Market Announcements
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {notices.length === 0 ? (
          <div style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            No community notices published today. Check back soon for market announcements.
          </div>
        ) : (
          notices.map((notice) => (
            <div 
              key={notice.id} 
              style={{ 
                background: 'var(--bg-muted)', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                borderLeft: '3px solid var(--primary-green)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span className="notice-badge">{notice.category}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Calendar size={11} />
                  {notice.date}
                </span>
              </div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {notice.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {notice.excerpt}
              </p>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--primary-green)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Bell size={13} />
          <span>Subscribe to SMS Market Alerts</span>
        </button>
      </div>
    </div>
  );
}
