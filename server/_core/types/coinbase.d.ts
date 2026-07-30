declare module "coinbase-commerce-node" {
  export interface CryptoPricing {
    amount: string;
    currency: string;
  }

  export interface ChargePricing {
    bitcoin?: CryptoPricing;
    ethereum?: CryptoPricing;
    litecoin?: CryptoPricing;
    usdc?: CryptoPricing;
  }

  export interface ChargeAddresses {
    bitcoin?: string;
    ethereum?: string;
    litecoin?: string;
    usdc?: string;
  }

  export interface ChargeAmount {
    local: { amount: string; currency: string };
    crypto: { amount: string; currency: string };
  }

  export interface ChargeData {
    id: string;
    code: string;
    hosted_url: string;
    addresses?: ChargeAddresses;
    pricing?: ChargePricing;
    local_price?: { amount: string; currency: string };
    pricing_type?: string;
    expires_at?: string;
    status?: string;
    payments?: any[];
    timeline?: any[];
    metadata?: Record<string, string>;
  }

  export interface ChargeResource {
    create(data: any): Promise<ChargeData>;
    retrieve(id: string): Promise<ChargeData>;
  }

  export interface ClientType {
    init(apiKey: string): void;
  }

  export interface CoinbaseCommerce {
    Client: ClientType;
    resources: {
      Charge: ChargeResource;
    };
  }

  const CoinbaseCommerce: CoinbaseCommerce;
  export default CoinbaseCommerce;
}
