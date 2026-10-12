import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customRecipes } from "../../../db/schema";
import { errorResponse, ownerId } from "../helpers";
import { pinGuard } from "../../pin-auth";

const ages=new Set([6,7,8,9,12]);
const allowedAllergens=new Set(["Leche","Huevo","Cacahuete","Frutos de cáscara","Pescado","Crustáceos","Gluten","Soja","Sésamo","Moluscos","Apio","Mostaza","Altramuz","Sulfitos"]);
type RecipeInput={title?:unknown;minAgeMonths?:unknown;timeMinutes?:unknown;ingredients?:unknown;preparation?:unknown;allergens?:unknown};

function parseRecipe(body:RecipeInput){
  const title=typeof body.title==="string"?body.title.trim():"",minAgeMonths=Number(body.minAgeMonths),timeMinutes=Number(body.timeMinutes),preparation=typeof body.preparation==="string"?body.preparation.trim():"";
  const ingredients=Array.isArray(body.ingredients)?body.ingredients.map(value=>typeof value==="string"?value.trim():"").filter(Boolean):[];
  const allergens=Array.isArray(body.allergens)?[...new Set(body.allergens.filter((value):value is string=>typeof value==="string"&&allowedAllergens.has(value)))]:[];
  if(!title||title.length>100||!ages.has(minAgeMonths)||!Number.isInteger(timeMinutes)||timeMinutes<1||timeMinutes>240||ingredients.length<1||ingredients.length>20||ingredients.some(value=>value.length>100)||!preparation||preparation.length>1000||allergens.length!==(Array.isArray(body.allergens)?body.allergens.length:0))return null;
  return{title,minAgeMonths,timeMinutes,ingredients,preparation,allergens};
}
function serialize(row:typeof customRecipes.$inferSelect){return{id:row.id,title:row.title,minAgeMonths:row.minAgeMonths,timeMinutes:row.timeMinutes,ingredients:JSON.parse(row.ingredientsJson) as string[],preparation:row.preparation,allergens:JSON.parse(row.allergensJson) as string[],createdAt:row.createdAt,updatedAt:row.updatedAt}}

export async function GET(request:Request){const denied=await pinGuard(request);if(denied)return denied;try{const rows=await getDb().select().from(customRecipes).where(eq(customRecipes.ownerId,ownerId(request))).orderBy(desc(customRecipes.createdAt));return Response.json({recipes:rows.flatMap(row=>{try{return[serialize(row)]}catch{return[]}})})}catch(error){return errorResponse(error)}}
export async function POST(request:Request){const denied=await pinGuard(request);if(denied)return denied;try{const parsed=parseRecipe(await request.json() as RecipeInput);if(!parsed)return Response.json({error:"Revisa el título, la edad, los ingredientes y la preparación."},{status:400});const now=new Date().toISOString(),recipe={id:crypto.randomUUID(),ownerId:ownerId(request),title:parsed.title,minAgeMonths:parsed.minAgeMonths,timeMinutes:parsed.timeMinutes,ingredientsJson:JSON.stringify(parsed.ingredients),preparation:parsed.preparation,allergensJson:JSON.stringify(parsed.allergens),createdAt:now,updatedAt:now};await getDb().insert(customRecipes).values(recipe);return Response.json({recipe:serialize(recipe)},{status:201})}catch(error){return errorResponse(error)}}

