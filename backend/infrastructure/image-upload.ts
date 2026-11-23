export class ImageUploadError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

const MAX_BYTES = 5 * 1024 * 1024;
const signatures: Record<string, {extension:string,valid:(bytes:Uint8Array)=>boolean}> = {
  "image/jpeg": {extension:"jpg",valid:bytes=>bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff},
  "image/png": {extension:"png",valid:bytes=>[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)},
  "image/webp": {extension:"webp",valid:bytes=>[82,73,70,70].every((value,index)=>bytes[index]===value)&&[87,69,66,80].every((value,index)=>bytes[index+8]===value)},
};

export function inspectImage(contentType:string,buffer:ArrayBuffer){
  const spec=signatures[contentType];
  if(!spec) throw new ImageUploadError("Usa una foto JPG, PNG o WebP",415);
  if(buffer.byteLength<20||buffer.byteLength>MAX_BYTES) throw new ImageUploadError("La foto debe pesar entre 20 bytes y 5 MB",413);
  if(!spec.valid(new Uint8Array(buffer))) throw new ImageUploadError("La foto no coincide con el formato indicado",415);
  return spec.extension;
}
