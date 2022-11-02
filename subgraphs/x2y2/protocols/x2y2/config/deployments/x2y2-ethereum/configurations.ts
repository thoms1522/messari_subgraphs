import { Network } from "../../../../../src/helper";
import {
  PROTOCOL_MARKETPLACE_ADDRESS,
  PROTOCOL_MARKETPLACE_NAME,
  PROTOCOL_MARKETPLACE_SLUG,
} from "../../../src/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class X2Y2EthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_MARKETPLACE_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_MARKETPLACE_SLUG;
  }
  getMarketplaceAddress(): string {
    return PROTOCOL_MARKETPLACE_ADDRESS;
  }
}
