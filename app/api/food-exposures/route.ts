import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, foodExposures } from "../../../db/schema";
import { errorResponse, ownerId, validDate } from "../helpers";
import { pinGuard } from "../../pin-auth";

const allergenIds=new Set(["milk","egg","peanut","tree-nuts","fish","shellfish","wheat","soy","sesame","molluscs","celery","mustard","lupin","sulphites"]);

export async function PATCH(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{
    const body=await request.json() as {childId?:string;allergenId?:string;dayIndex?:number;checked?:boolean;exposedAt?:string};
    const owner=ownerId(request),dayIndex=Number(body.dayIndex),exposedAt=body.exposedAt;
    if(!body.childId||!allergenIds.has(body.allergenId??"")||![1,2,3].includes(dayIndex)||typeof body.checked!=="boolean"||body.checked&&!validDate(exposedAt))return Response.json({error:"Registro de exposición no válido."},{status:400});
    const db=getDb(),[child]=await db.select({id:children.id}).from(children).where(and(eq(children.id,body.childId),eq(children.ownerId,owner))).limit(1);
    if(!child)return Response.json({error:"Perfil no encontrado."},{status:404});
    await db.delete(foodExposures).where(and(eq(foodExposures.childId,body.childId),eq(foodExposures.allergenId,body.allergenId!),eq(foodExposures.dayIndex,dayIndex)));
    if(body.checked)await db.insert(foodExposures).values({id:crypto.randomUUID(),childId:body.childId,ownerId:owner,allergenId:body.allergenId!,dayIndex,exposedAt:exposedAt!});
    return Response.json({exposure:body.checked?{childId:body.childId,allergenId:body.allergenId,dayIndex,exposedAt}:null});
  }catch(error){return errorResponse(error)}
}
