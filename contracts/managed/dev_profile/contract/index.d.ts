import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Tier { Yellow = 0, Green = 1 }

export enum RevealPolicy { ScoreOnly = 0,
                           FieldsOnPolicy = 1,
                           ApprovalRequired = 2
}

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerProfile(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  tier_0: Tier,
                  policy_0: RevealPolicy): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerProfile(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  tier_0: Tier,
                  policy_0: RevealPolicy): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerProfile(context: __compactRuntime.CircuitContext<PS>,
                  commitment_0: Uint8Array,
                  tier_0: Tier,
                  policy_0: RevealPolicy): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  profiles: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  tiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Tier;
    [Symbol.iterator](): Iterator<[Uint8Array, Tier]>
  };
  revealPolicies: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): RevealPolicy;
    [Symbol.iterator](): Iterator<[Uint8Array, RevealPolicy]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
