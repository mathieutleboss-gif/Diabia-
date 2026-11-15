import type {Food} from './core';
import catalog from './photo-catalog.json';

/** Curated identifiers only: never infer a photo from a keyword or category. */
export const foodPhotos=catalog;
const byId=new Map(foodPhotos.map(photo=>[photo.foodId,photo]));
export function photoAliment(food:Food){
 const photo=byId.get(food.id);
 return photo?.expectedName===food.nom?photo:undefined;
}
