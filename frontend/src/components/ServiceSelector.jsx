import React, { useState, useEffect, useRef } from 'react';
import DropDown from './DropDown';
import api from '@/utils/api';

const ServiceSelector = ({ category, setCategory }) => {

    const [services, setServices] = useState([]);

    const fetchServices = async () => {
        try {
            const response = await api.get("/services");
            setServices(response.data)
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);


    return (
        <DropDown
            categories={services}
            selectedId={category}
            onSelect={setCategory}
            placeholder="Select Category"
        />
    );
};

export default ServiceSelector;