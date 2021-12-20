// Import Types and Connection from web3
import {
    Supply,
    Connection,
    clusterApiUrl,
    VoteAccountStatus,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

// Import formatters for better visualization
import { abbreviatedNumber, lamportsToSol } from "../../utils/utils";
import React from "react";

import { Typography, Row, Card } from "antd";
const { Title, Paragraph } = Typography;

// Convert lamports ( A fractional native token ) in more human readable format
function displayLamports(value: number) {
    return abbreviatedNumber(lamportsToSol(value));
}

export default function SupplyCard() {
    const [supply, setSupply] = useState<Supply>();
    const [voteAccounts, setVoteAccounts] = useState<VoteAccountStatus>();
    useEffect(() => {
        getSupply();
    }, []);

    // Use connection to get the supply and the number of vote accounts
    async function getSupply() {
        const url = clusterApiUrl("devnet").replace("api", "explorer-api");
        const connection = new Connection(url, "finalized");
        const supply: Supply = (await connection.getSupply()).value;
        const voteAccounts = await connection.getVoteAccounts();
        setVoteAccounts(voteAccounts);
        setSupply(supply);
    }

    // Get delinquent or inactive validators
    const delinquentStake = React.useMemo(() => {
        if (voteAccounts) {
            return voteAccounts.delinquent.reduce(
                (prev, current) => prev + current.activatedStake,
                0
            );
        }
    }, [voteAccounts]);

    // Get active validators
    const activeStake = React.useMemo(() => {
        if (voteAccounts && delinquentStake) {
            return (
                voteAccounts.current.reduce(
                    (prev, current) => prev + current.activatedStake,
                    0
                ) + delinquentStake
            );
        }
    }, [voteAccounts, delinquentStake]);

    // Get the percentage of stake that are in delinquent
    let delinquentStakePercentage;
    if (delinquentStake && activeStake) {
        delinquentStakePercentage = ((delinquentStake / activeStake) * 100).toFixed(
            1
        );
    }

    return (
        <Row gutter={[16, 16]} align="top" justify="center">
            {/* Show Active Stake */}
            <Card
                hoverable
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Title level={3}>Active Stake</Title>
                {activeStake && supply && (
                    <>
                        <Paragraph>
                            <em>{displayLamports(activeStake)}</em> /{" "}
                            <small>{displayLamports(supply.total)}</small>
                        </Paragraph>
                        {delinquentStakePercentage && (
                            <Paragraph>
                                24h Vol: Delinquent stake: <em>{delinquentStakePercentage}%</em>
                            </Paragraph>
                        )}
                    </>
                )}
            </Card>

            {/* Show Circulating Supply */}
            <Card
                hoverable
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Title level={3}>Circulating Supply</Title>
                {activeStake && supply && (
                    <>
                        <Paragraph>
                            <em>{displayLamports(supply.circulating)}</em> /{" "}
                            <small>{displayLamports(supply.total)}</small>
                        </Paragraph>
                        <Paragraph>
                            Non circulating <em>{displayLamports(supply.nonCirculating)}</em>
                        </Paragraph>
                    </>
                )}
            </Card>
        </Row>
    );
}