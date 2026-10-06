import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, leavePlans, measurements } from "../../../db/schema";
import { errorResponse, ownerId, validDate } from "../helpers";
import { pinGuard } from "../../pin-auth";

type ImportedMeasurement={measuredAt:string;weightKg:number|null;heightCm:number|null;headCm:number|null;notes:string};
type ImportedPlan={periods:{id:string;label:string;person:string;days:number;counting:"calendar"|"workdays"}[];holidays:{date:string;label:string}[]};
type ImportedChild={name:string;birthDate:string;lastPeriodDate:string|null;expectedBirthDate:string|null;actualBirthDate:string|null;sex:"male"|"female";leavePlan:ImportedPlan|null;measurements:ImportedMeasurement[]};

function numberOrNull(value:unknown,min:number,max:number){
  if(value==null)return null;
  return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max?value:undefined;
}

function parseBackup(value:unknown):ImportedChild[]|null{
  if(!value||typeof value!=="object")return null;
  const backup=value as {app?:unknown;version?:unknown;children?:unknown};
  if(backup.app!=="Nuevas nutrias"||![1,2].includes(Number(backup.version))||!Array.isArray(backup.children)||backup.children.length>100)return null;
  let totalMeasurements=0;
  const parsed:ImportedChild[]=[];
  for(const item of backup.children){
    if(!item||typeof item!=="object")return null;
    const child=item as {name?:unknown;birthDate?:unknown;lastPeriodDate?:unknown;expectedBirthDate?:unknown;actualBirthDate?:unknown;sex?:unknown;leavePlan?:unknown;measurements?:unknown};
    const name=typeof child.name==="string"?child.name.trim():"";
    if(!name||name.length>80||!validDate(child.birthDate)||!(["male","female"] as unknown[]).includes(child.sex)||!Array.isArray(child.measurements))return null;
    const optionalDate=(value:unknown)=>value==null||value===""?null:validDate(value)?value:null;
    const lastPeriodDate=optionalDate(child.lastPeriodDate),expectedBirthDate=optionalDate(child.expectedBirthDate),actualBirthDate=optionalDate(child.actualBirthDate);
    if((child.lastPeriodDate&&!lastPeriodDate)||(child.expectedBirthDate&&!expectedBirthDate)||(child.actualBirthDate&&!actualBirthDate))return null;
    let leavePlan:ImportedPlan|null=null;
    if(child.leavePlan!=null){
      if(!child.leavePlan||typeof child.leavePlan!=="object")return null;
      const rawPlan=child.leavePlan as {periods?:unknown;holidays?:unknown};
      if(!Array.isArray(rawPlan.periods)||!Array.isArray(rawPlan.holidays)||rawPlan.periods.length<1||rawPlan.periods.length>40||rawPlan.holidays.length>400)return null;
      const periods=[] as ImportedPlan["periods"];
      for(const raw of rawPlan.periods){if(!raw||typeof raw!=="object")return null;const p=raw as {id?:unknown;label?:unknown;person?:unknown;days?:unknown;counting?:unknown};const label=typeof p.label==="string"?p.label.trim():"",person=typeof p.person==="string"?p.person.trim():"",days=typeof p.days==="number"?Math.trunc(p.days):NaN;if(!label||!person||!Number.isFinite(days)||days<1||days>730||!["calendar","workdays"].includes(String(p.counting)))return null;periods.push({id:typeof p.id==="string"?p.id:crypto.randomUUID(),label,person,days,counting:p.counting as "calendar"|"workdays"})}
      const holidays=[] as ImportedPlan["holidays"],holidayDates=new Set<string>();
      for(const raw of rawPlan.holidays){if(!raw||typeof raw!=="object")return null;const h=raw as {date?:unknown;label?:unknown};const label=typeof h.label==="string"?h.label.trim():"";if(!validDate(h.date)||!label||holidayDates.has(h.date))return null;holidayDates.add(h.date);holidays.push({date:h.date,label})}
      leavePlan={periods,holidays};
    }
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
    parsed.push({name,birthDate:child.birthDate,lastPeriodDate,expectedBirthDate,actualBirthDate:actualBirthDate??(Number(backup.version)===1?child.birthDate:null),sex:child.sex as "male"|"female",leavePlan,measurements:importedMeasurements});
  }
  return parsed;
}

export async function POST(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
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
        await db.insert(children).values({id:childId,ownerId:owner,name:child.name,birthDate:child.birthDate,lastPeriodDate:child.lastPeriodDate,expectedBirthDate:child.expectedBirthDate,actualBirthDate:child.actualBirthDate,sex:child.sex});
        childByKey.set(childKey,childId);
        childrenAdded++;
      }
      if(child.leavePlan){const periodsJson=JSON.stringify(child.leavePlan.periods),holidaysJson=JSON.stringify(child.leavePlan.holidays),updatedAt=new Date().toISOString();await db.insert(leavePlans).values({childId,ownerId:owner,periodsJson,holidaysJson,updatedAt}).onConflictDoUpdate({target:leavePlans.childId,set:{periodsJson,holidaysJson,updatedAt}})}
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
