import type {Food} from './core';
export const foodPhotos=[
 {foodId:'ciqual:13005',expectedName:'Banane, chair sans peau, crue',src:'/foods/banane-crue.jpg',author:'Evan-Amos',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Banana-Single.jpg'},
 {foodId:'ciqual:13039',expectedName:'Pomme, chair et peau, crue',src:'/foods/pomme-crue.jpg',author:'Abhijit Tembhekar',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Red_Apple.jpg'},
 {foodId:'ciqual:13034',expectedName:'Orange, chair sans peau, sans pépins, crue',src:'/foods/orange-crue.jpg',author:'Evan-Amos',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Orange-Whole-%26-Split.jpg'},
];
export function photoAliment(food:Food){return foodPhotos.find(p=>p.foodId===food.id&&p.expectedName===food.nom);}
