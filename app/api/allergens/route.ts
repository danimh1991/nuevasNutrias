import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customAllergens, hiddenAllergens } from "../../../db/schema";
import { errorResponse, ownerId } from "../helpers";
import { pinGuard } from "../../pin-auth";

type AllergenInput={name?:unknown;hint?:unknown;emoji?:unknown};

export async function GET(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{
    const owner=ownerId(request),db=getDb();
    const[custom,hidden]=await Promise.all([
      db.select().from(customAllergens).where(eq(customAllergens.ownerId,owner)).orderBy(desc(customAllergens.createdAt)),
      db.select({allergenId:hiddenAllergens.allergenId}).from(hiddenAllergens).where(eq(hiddenAllergens.ownerId,owner)),
    ]);
    return Response.json({custom:custom.map(item=>({...item,custom:true})),hiddenIds:hidden.map(item=>item.allergenId)});
  }catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{
    const body=await request.json() as AllergenInput,name=typeof body.name==="string"?body.name.trim():"",hint=typeof body.hint==="string"?body.hint.trim():"",emoji=typeof body.emoji==="string"?body.emoji.trim():"";
    if(!name||name.length>60||hint.length>160||!emoji||emoji.length>16)return Response.json({error:"Revisa el nombre, el icono y la indicación."},{status:400});
    const allergen={id:`custom-${crypto.randomUUID()}`,ownerId:ownerId(request),name,hint,emoji,createdAt:new Date().toISOString()};
    await getDb().insert(customAllergens).values(allergen);
    return Response.json({allergen:{...allergen,custom:true}},{status:201});
  }catch(error){return errorResponse(error)}
}
