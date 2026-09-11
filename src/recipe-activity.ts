export const RECIPE_PROMPT = "Create a personal recipe app where I can add, edit, and find my favorite recipes. Include a recipe name, ingredients, and instructions. Keep it simple and save my recipes in this browser. No sign-in needed.";
export type RecipeBuild = {
  status: "idle" | "submitting" | "creating" | "complete" | "unknown" | "failed";
  replId?: string;
  replUrl?: string;
  previewUrl?: string;
};
