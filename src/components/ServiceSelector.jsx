import React, { useState, useEffect, useRef } from 'react';
import DropDown from './DropDown';

const categories = [
    { id: 1, name: 'Retail & Shopping' },
    { id: 2, name: 'Food & Beverage' },
    { id: 3, name: 'Technology & Software' },
    { id: 4, name: 'Professional Services' },
    { id: 5, name: 'Health & Wellness' },
    { id: 6, name: 'Education & Learning' },
    { id: 7, name: 'Beauty & Fashion' },
    { id: 8, name: 'Finance & Insurance' }
];

const ServiceSelector = ({ category, setCategory }) => {

    return (
        <DropDown
            categories={categories}
            selectedId={category}
            onSelect={setCategory}
            placeholder="Select Category"
        />
    );
};

export default ServiceSelector;