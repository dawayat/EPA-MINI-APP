import test from 'node:test';
import assert from 'node:assert/strict';
import {articlesApproval} from '../api/_governance_results.js';
test('articles need two-thirds of all ballots, including abstentions, and close before final result',()=>{
 assert.equal(articlesApproval({approve:2,reject:0,abstain:1},3,'closed').status,'passed');
 assert.equal(articlesApproval({approve:2,abstain:2},4,'closed').status,'not_passed');
 assert.equal(articlesApproval({approve:3,abstain:2},5,'closed').required,4);
 assert.equal(articlesApproval({approve:2},3,'voting').status,'pending');
 assert.equal(articlesApproval({},0,'closed').status,'no_ballots');
});
