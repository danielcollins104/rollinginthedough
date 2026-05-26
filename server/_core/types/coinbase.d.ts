declare module "coinbase-commerce-node" {
  export interface ChargeData {
    id: string;
    code: string;
    hosted_url: string;
    address?: string;
    amount?: string;
    currency?: string;
    pricing?: {
      bitcoin?: { amount: string };
      ethereum?: { amount: string };
      litecoin?: { amount: string };
      usdc?: { amount: string };
    };
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
