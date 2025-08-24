export interface FoodProduct {
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    serving_size_g?: number;
}

export const fetchFoodProductByBarcode = async (barcode: string): Promise<FoodProduct | null> => {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (!response.ok) {
            console.error('Failed to fetch product from Open Food Facts');
            return null;
        }
        const data = await response.json();

        if (data.status === 0) {
            console.error('Product not found in Open Food Facts');
            return null;
        }

        const product = data.product;
        const nutriments = product.nutriments;
        
        return {
            name: product.product_name || 'Unknown Product',
            calories: nutriments['energy-kcal_100g'] || 0,
            protein: nutriments.proteins_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            fat: nutriments.fat_100g || 0,
            serving_size_g: 100,
        };

    } catch (error) {
        console.error('Error fetching food product:', error);
        return null;
    }
};