import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, measurements } from "../../../db/schema";
import { errorResponse, ownerId, validDate } from "../helpers";

type ImportedMeasurement={measuredAt:string;weightKg:number|null;heightCm:number|null;headCm:number|null;notes:string};
type ImportedChild={name:string;birthDate:string;sex:"male"|"female";measurements:ImportedMeasurement[]};

function numberOrNull(value:unknown,min:number,max:number){
  if(value==null)return null;
  return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max?value:undefined;
}

function parseBackup(value:unknown):ImportedChild[]|null{
  if(!value||typeof value!=="object")return null;
  const backup=value as {app?:unknown;version?:unknown;children?:unknown};
  if(backup.app!=="Nuevas nutrias"||backup.version!==1||!Array.isArray(backup.children)||backup.children.length>100)return null;
  let totalMeasurements=0;
  const parsed:ImportedChild[]=[];
  for(const item of backup.children){
    if(!item||typeof item!=="object")return null;
    const child=item as {name?:unknown;birthDate?:unknown;sex?:unknown;measurements?:unknown};
    const name=typeof child.name==="string"?child.name.trim():"";
    if(!name||name.length>80||!validDate(child.birthDate)||!(["male","female"] as unknown[]).includes(child.sex)||!Array.isArray(child.measurements))return null;
    totalMeasurements+=child.measurements.length;
    if(totalMeasurements>5000)return null;
    const importedMeasurements:ImportedMeasurement[]=[];
    for(const raw of child.measurements){
      if(!raw||typeof raw!=="object")return null;
      const measure=raw as {measuredAt?:unknown;weightKg?:unknown;heightCm?:unknown;headCm?:unknown;notes?:unknown};
      const weightKg=numberOrNull(measure.weightKg,0.5,40),heightCm=numberOrNull(measure.heightCm,30,140),headCm=numberOrNull(measure.headCm,20,65);
      const notes=measure.notes==null?"":typeof measure.notes==="string"?measure.notes.trim():null;
      if(!validDate(measure.measuredAt)||measure.measuredAt<child.birthDate||weightKg===undefined||heightCm===undefined||headCm===undefined||(!weightKg&&!heightCm&&!headCm)||notes==null||notes.length>300)return null;
      importedMeasurements.push({measuredAt:measure.measuredAt,weightKg,heightCm,headCm,notes});
    }
    parsed.push({name,birthDate:child.birthDate,sex:child.sex as "male"|"female",measurements:importedMeasurements});
  }
  return parsed;
}

export async function POST(request:Request){
  try{
    const imported=parseBackup(await request.json());
    if(!imported)return Response.json({error:"El archivo no es una copia válida de Nuevas nutrias."},{status:400});
    const owner=ownerId(request),db=getDb();
    const currentChildren=await db.select().from(children).where(eq(children.ownerId,owner));
    const currentMeasurements=await db.select().from(measurements).where(eq(measurements.ownerId,owner));
    const childByKey=new Map(currentChildren.map(child=>[`${child.name.trim().toLocaleLowerCase("es-ES")}|${child.birthDate}|${child.sex}`,child.id]));
    const measureKeys=new Set(currentMeasurements.map(measure=>`${measure.childId}|${measure.measuredAt}|${measure.weightGrams??""}|${measure.heightMm??""}|${measure.headMm??""}|${measure.notes.trim()}`));
    let childrenAdded=0,measurementsAdded=0,measurementsSkipped=0;
    for(const child of imported){
      const childKey=`${child.name.toLocaleLowerCase("es-ES")}|${child.birthDate}|${child.sex}`;
      let childId=childByKey.get(childKey);
      if(!childId){
        childId=crypto.randomUUID();
        await db.insert(children).values({id:childId,ownerId:owner,name:child.name,birthDate:child.birthDate,sex:child.sex});
        childByKey.set(childKey,childId);
        childrenAdded++;
      }
      for(const measure of child.measurements){
        const weightGrams=measure.weightKg==null?null:Math.round(measure.weightKg*1000),heightMm=measure.heightCm==null?null:Math.round(measure.heightCm*10),headMm=measure.headCm==null?null:Math.round(measure.headCm*10);
        const measureKey=`${childId}|${measure.measuredAt}|${weightGrams??""}|${heightMm??""}|${headMm??""}|${measure.notes}`;
        if(measureKeys.has(measureKey)){measurementsSkipped++;continue;}
        await db.insert(measurements).values({id:crypto.randomUUID(),childId,ownerId:owner,measuredAt:measure.measuredAt,weightGrams,heightMm,headMm,notes:measure.notes});
        measureKeys.add(measureKey);
        measurementsAdded++;
      }
    }
    return Response.json({childrenAdded,measurementsAdded,measurementsSkipped});
  }catch(error){return errorResponse(error)}
}
