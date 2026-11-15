import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {peutRecupererSansConflit} from '../lib/sync';
test('une version distante plus récente ne remplace automatiquement qu’un historique local inchangé',()=>{const digest='a'.repeat(64);assert.equal(peutRecupererSansConflit({revision:2,digest},3,digest),true);for(const [meta,r,d] of [[{revision:2,digest},2,digest],[{revision:2,digest},1,digest],[{revision:2,digest},3,'b'.repeat(64)],[{},3,digest],[{revision:0,digest},3,digest],[{revision:2,digest:''},3,'']] as const)assert.equal(peutRecupererSansConflit(meta,r,d),false);});
