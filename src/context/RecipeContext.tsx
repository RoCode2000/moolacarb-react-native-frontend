import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Recipe {
  recipeId: string;
  title: string;
  serving: number;
  ingredients: string;
  instructions: string;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  status: string;
  author: string;
  prepTime: number;
  cookTime: number;
  restingTime: number;
  cuisine: string;
  description: string;
  mealType: string;
  overallRating: number;
  imageLink: string;
  imageBinary: string;
}

type RecipeContextType = {
  recipes: Record<string, Recipe>;
  addRecipe: (recipe: Recipe) => void;
  getRecipe: (id: string) => Recipe | undefined;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});

  const addRecipe = (recipe: Recipe) => {
    setRecipes((prev) => ({ ...prev, [recipe.recipeId]: recipe }));
  };

  const getRecipe = (id: string) => recipes[id];

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, getRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error("useRecipes must be used within RecipeProvider");
  return context;
};
