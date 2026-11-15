"use client";
import {useState} from 'react';
import type {Food} from '../../lib/nutrition/core';
import {photoAliment} from '../../lib/nutrition/photos';
export default function FoodPhoto({food}:{food:Food}){const photo=photoAliment(food),[failed,setFailed]=useState(false);return <span className="nutrition-photo">{photo&&!failed?<img src={photo.src} width={60} height={60} loading="lazy" decoding="async" alt={`Photographie illustrative : ${food.nom}`} onError={()=>setFailed(true)}/>:<svg width="32" height="32" viewBox="0 0 32 32" fill="none" role="img" aria-label="Photographie non disponible"><rect x="4" y="5" width="24" height="22" rx="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12" r="2" stroke="currentColor"/><path d="m7 23 7-7 4 4 4-5 4 8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>}</span>;}
