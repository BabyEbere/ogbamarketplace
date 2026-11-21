'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  icon,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: icon ? '0.65rem 0.85rem 0.65rem 2.35rem' : '0.65rem 0.85rem',
          background: open ? '#FFFFFF' : '#F8FAFC',
          border: open ? '1.5px solid #1E5E3A' : '1px solid #E2E8F0',
          borderRadius: '12px',
          fontSize: '0.86rem',
          fontWeight: 600,
          color: selected ? '#111827' : '#94A3B8',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(30, 94, 58, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: open ? '#1E5E3A' : '#94A3B8',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}

        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel ? (
                <span style={{ color: '#64748B', fontWeight: 500, marginLeft: '0.35rem', fontSize: '0.78rem' }}>
                  ({selected.sublabel})
                </span>
              ) : null}
            </>
          ) : (
            placeholder
          )}
        </span>

        <ChevronDown
          size={16}
          style={{
            color: open ? '#1E5E3A' : '#64748B',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: '230px',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
            zIndex: 60,
            padding: '0.35rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#EBF7EE' : 'transparent',
                    color: isSelected ? '#1E5E3A' : '#1E293B',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                    {opt.sublabel ? (
                      <span style={{ color: '#64748B', fontWeight: 400, marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                        ({opt.sublabel})
                      </span>
                    ) : null}
                  </span>
                  {isSelected && <Check size={15} color="#1E5E3A" style={{ flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

