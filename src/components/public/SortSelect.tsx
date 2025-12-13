'use client';

import React from 'react';

interface SortSelectProps {
  currentSort: string;
}

export function SortSelect({ currentSort }: SortSelectProps) {
  return (
    <select
      defaultValue={currentSort}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', e.target.value);
        window.location.href = url.toString();
      }}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="recommended">Recommended</option>
      <option value="price_low">Price: Low to High</option>
      <option value="price_high">Price: High to Low</option>
      <option value="newest">Newest First</option>
      <option value="rating">Highest Rated</option>
    </select>
  );
}

export default SortSelect;
