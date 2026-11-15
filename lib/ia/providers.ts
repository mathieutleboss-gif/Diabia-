export type AIProviderName = 'simulation' | 'anthropic' | 'vertex' | 'openai' | 'compatible';
export interface AIProvider { readonly name: AIProviderName; readonly status: 'simulation' | 'configuration-requise'; answer(input: {type:'tendance'|'question'|'glucides'; text:string}): Promise<string> }
export const simulatedAI: AIProvider = {name:'simulation',status:'simulation',async answer(input) {
  if (input.type === 'glucides') return 'Simulation : aucune estimation calculée. Vérifie la portion et les glucides sur une source fiable ; une description ou une photo ne permet pas une mesure exacte.';
  if (input.type === 'tendance') return 'Simulation : compare les périodes et la qualité des données avec un professionnel de santé. Cet exemple ne traite aucune donnée personnelle.';
  return 'Simulation : les glycémies peuvent varier pour de nombreuses raisons. Un professionnel de santé peut aider à interpréter une situation personnelle.';
}};
export function selectionnerIA(name: AIProviderName): AIProvider {
  if (name === 'simulation') return simulatedAI;
  return {name,status:'configuration-requise',async answer(){throw new Error('Fournisseur externe désactivé : configuration et garanties non validées.');}};
}
