import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, customAllergens, foodExposures } from "../../../db/schema";
import { errorResponse, ownerId, validDate } from "../helpers";
import { pinGuard } from "../../pin-auth";

const defaultAllergenIds=new Set(["milk","egg","peanut","tree-nuts","fish","shellfish","wheat","soy","sesame","molluscs","celery","mustard","lupin","sulphites"]);

export async function PATCH(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{
    const body=await request.json() as {childId?:string;allergenId?:string;dayIndex?:number;checked?:boolean;exposedAt?:string};
    const owner=ownerId(request),dayIndex=Number(body.dayIndex),exposedAt=body.exposedAt;
    if(!body.childId||!body.allergenId||![1,2,3].includes(dayIndex)||typeof body.checked!=="boolean"||body.checked&&!validDate(exposedAt))return Response.json({error:"Registro de exposición no válido."},{status:400});
    const db=getDb(),[child]=await db.select({id:children.id}).from(children).where(and(eq(children.id,body.childId),eq(children.ownerId,owner))).limit(1);
    if(!child)return Response.json({error:"Perfil no encontrado."},{status:404});
    if(!defaultAllergenIds.has(body.allergenId)){
      const[custom]=await db.select({id:customAllergens.id}).from(customAllergens).where(and(eq(customAllergens.id,body.allergenId),eq(customAllergens.ownerId,owner))).limit(1);
      if(!custom)return Response.json({error:"Alimento no encontrado."},{status:404});
    }
    if(!body.checked){
      await db.delete(foodExposures).where(and(eq(foodExposures.childId,body.childId),eq(foodExposures.allergenId,body.allergenId),eq(foodExposures.dayIndex,dayIndex)));
      return Response.json({exposure:null});
    }
    const createdAt=new Date().toISOString(),exposure={id:crypto.randomUUID(),childId:body.childId,ownerId:owner,allergenId:body.allergenId,dayIndex,exposedAt:exposedAt!,createdAt};
    await db.insert(foodExposures).values(exposure).onConflictDoUpdate({
      target:[foodExposures.childId,foodExposures.allergenId,foodExposures.dayIndex],
      set:{exposedAt:exposedAt!,createdAt},
    });
    return Response.json({exposure:{childId:body.childId,allergenId:body.allergenId,dayIndex,exposedAt,createdAt}});
  }catch(error){return errorResponse(error)}
}
