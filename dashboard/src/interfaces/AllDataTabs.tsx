import { TabContext, TabPanel } from "@mui/lab";
import { Box, Tab, Tabs } from "@mui/material";
import React from "react";
import { ProtocolTypeEntity } from "../constants";
import EventsTab from "./tabs/EventsTab";
import PoolTab from "./tabs/PoolTab";
import ProtocolTab from "./tabs/ProtocolTab";
import { styled } from "../styled";
import WarningDisplay from "./WarningDisplay";
import { ProtocolWarning } from "../graphs/types";

const StyledTabs = styled(Tabs)`
  background: #292f38;
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

interface AllDataTabsProps {
  data: any;
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  protocolFields: { [x: string]: string };
  tabValue: string;
  handleTabChange: (event: any, newValue: string) => void;
  issues: { message: string; type: string }[];
  poolId: string;
  poolData: { [x: string]: string };
  events: string[];
  setPoolId: React.Dispatch<React.SetStateAction<string>>;
  poolNames: string;
  setWarning: React.Dispatch<React.SetStateAction<{ message: string; type: string }[]>>;
  warnings: ProtocolWarning[];
}

// This component is for each individual subgraph
function AllDataTabs({
  data,
  entities,
  entitiesData,
  protocolFields,
  tabValue,
  handleTabChange,
  issues,
  poolId,
  poolData,
  events,
  setPoolId,
  setWarning,
  poolNames,
  warnings,
}: AllDataTabsProps) {
  const protocolEntityName = ProtocolTypeEntity[data.protocols[0].type];
  console.log("FULLDATAOBJ", data, data[protocolEntityName][0]?.lendingType, "sloop", events);
  if (data[protocolEntityName][0]?.lendingType === "CDP") {
    protocolFields.mintedTokens += "!";
    protocolFields.mintedTokenSupplies += "!";
  }

  return (
    <>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Protocol" value="1" />
            <Tab label="Pool" value="2" />
            <Tab label="Events" value="3" />
          </StyledTabs>
        </Box>
        <WarningDisplay warningArray={warnings} />

        <TabPanel value="1">
          {/* PROTOCOL TAB */}
          <ProtocolTab
            data={data}
            entities={entities}
            entitiesData={entitiesData}
            protocolFields={protocolFields}
            setWarning={setWarning}
            warnings={issues}
          />
        </TabPanel>
        <TabPanel value="2">
          {/* POOL TAB */}
          <PoolTab
            data={data}
            entities={entities}
            entitiesData={entitiesData}
            poolId={poolId}
            setPoolId={(x) => setPoolId(x)}
            poolData={poolData}
            setWarning={(x) => setWarning(x)}
            issues={issues}
          />
        </TabPanel>
        <TabPanel value="3">
          {/* EVENTS TAB */}
          <EventsTab
            data={data}
            events={events}
            issues={issues}
            poolId={poolId}
            setPoolId={(x) => setPoolId(x)}
            poolNames={poolNames}
            setWarning={(x) => setWarning(x)}
          />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default AllDataTabs;
