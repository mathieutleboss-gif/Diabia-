/** Only download automatically when local data still matches its last saved baseline. */
export function peutRecupererSansConflit(meta:{revision?:number;digest?:string},remoteRevision:number,localDigest:string){
 const revision=meta.revision;
 return typeof revision==='number'&&Number.isSafeInteger(revision)&&revision>0&&Number.isSafeInteger(remoteRevision)&&remoteRevision>revision&&typeof meta.digest==='string'&&meta.digest.length===64&&meta.digest===localDigest;
}
