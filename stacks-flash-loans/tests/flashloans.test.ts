import { Cl } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;

const mockToken = Cl.contractPrincipal(deployer, "mock-token");
const flasher = Cl.contractPrincipal(deployer, "flasher");
const mockFlashRecipient = Cl.contractPrincipal(
	  deployer,
	    "mock-flash-recipient"
);

describe("Flashloans", () => {
	  beforeEach(() => {
		      // Give the flash loan protocol some mock tokens it can lend out
		          simnet.callPublicFn(
				        "mock-token",
					      "mint",
					            [Cl.uint(1_000_000_000), flasher],
						          deployer
							      );
							          
							          // Give the flash loan protocol some STX it can lend out
								      simnet.transferSTX(100_000_000n, `${deployer}.flasher`, alice);

								          // Initialize the mock flash recipient contract
									      simnet.callPublicFn(
										            "mock-flash-recipient",
											          "set-flashloans",
												        [flasher],
													      deployer
													          );
														    });

														      it("can flashloan STX and pay back", () => {
															          // Send 500 STX to the mock flash recipient
																      // so it has money to pay back the flashloan with fees
																          simnet.transferSTX(500n, `${deployer}.mock-flash-recipient`, alice);

																	      const flashStxResult = simnet.callPublicFn(
																		            "flasher",
																			          "flash-stx",
																				        [Cl.uint(100_000), mockFlashRecipient],
																					      alice
																					          );

																						      expect(flashStxResult.result).toBeOk(Cl.bool(true));
																						          expect(flashStxResult.events.length).toBe(2);

																							      expect(flashStxResult.events[0].event).toBe("stx_transfer_event");
																							          expect(flashStxResult.events[0].data).toStrictEqual({
																									        amount: "100000",
																										      recipient: `${deployer}.mock-flash-recipient`,
																										            sender: `${deployer}.flasher`,
																											          memo: "",
																												      });

																												          expect(flashStxResult.events[1].event).toBe("stx_transfer_event");
																													      expect(flashStxResult.events[1].data).toStrictEqual({
																														            amount: "100500",
																															          recipient: `${deployer}.flasher`,
																																        sender: `${deployer}.mock-flash-recipient`,
																																	      memo: "",
																																	          });
																																		    });

																																		      it("no STX lost if cannot pay back flashloan", () => {
																																			          const flasherOriginalSTXBalance = simnet
																																				        .getAssetsMap()
																																					      .get("STX")!
																																					            .get(`${deployer}.flasher`)!;

																																						        const flashStxResult = simnet.callPublicFn(
																																								      "flasher",
																																								            "flash-stx",
																																									          [Cl.uint(100_000), mockFlashRecipient],
																																										        alice
																																											    );

																																											        expect(flashStxResult.result).toBeErr(Cl.uint(103));

																																												    const flasherCurrentSTXBalance = simnet
																																												          .getAssetsMap()
																																													        .get("STX")!
																																														      .get(`${deployer}.flasher`)!;

																																														          expect(flasherCurrentSTXBalance).toBe(flasherOriginalSTXBalance);
																																															    });

																																															      it("can flashloan SIP010 token and pay back", () => {
																																																          // Send 1000 TOKEN to the mock flash recipient
																																																	      // so it has money to pay back the flashloan with fees
																																																	          simnet.callPublicFn(
																																																			        "mock-token",
																																																				      "mint",
																																																				            [Cl.uint(1_000), mockFlashRecipient],
																																																					          deployer
																																																						      );

																																																						          const flashSip010Result = simnet.callPublicFn(
																																																								        "flasher",
																																																									      "flash-sip010",
																																																									            [mockToken, Cl.uint(100_000), mockFlashRecipient],
																																																										          alice
																																																											      );

																																																											          expect(flashSip010Result.result).toBeOk(Cl.bool(true));
																																																												      expect(flashSip010Result.events.length).toBe(2);

																																																												          expect(flashSip010Result.events[0].event).toBe("ft_transfer_event");
																																																													      expect(flashSip010Result.events[0].data).toStrictEqual({
																																																														            amount: "100000",
																																																															          asset_identifier: `${deployer}.mock-token::mock-token`,
																																																																        recipient: `${deployer}.mock-flash-recipient`,
																																																																	      sender: `${deployer}.flasher`,
																																																																	          });

																																																																		      expect(flashSip010Result.events[1].event).toBe("ft_transfer_event");
																																																																		          expect(flashSip010Result.events[1].data).toStrictEqual({
																																																																				        amount: "101000",
																																																																					      asset_identifier: `${deployer}.mock-token::mock-token`,
																																																																					            recipient: `${deployer}.flasher`,
																																																																						          sender: `${deployer}.mock-flash-recipient`,
																																																																							      });
																																																																							        });

																																																																								  it("no token lost if cannot pay back flashloan", () => {
																																																																									      const flasherOriginalTokenBalance = simnet
																																																																									            .getAssetsMap()
																																																																										          .get(`${deployer}.mock-token::mock-token`)
																																																																											        ?.get(`${deployer}.flasher`) || 0n;

																																																																												    const flashSip010Result = simnet.callPublicFn(
																																																																													          "flasher",
																																																																														        "flash-sip010",
																																																																															      [mockToken, Cl.uint(100_000), mockFlashRecipient],
																																																																															            alice
																																																																																        );

																																																																																	    expect(flashSip010Result.result).toBeErr(Cl.uint(103));

																																																																																	        const flasherCurrentTokenBalance = simnet
																																																																																		      .getAssetsMap()
																																																																																		            .get(`${deployer}.mock-token::mock-token`)
																																																																																			          ?.get(`${deployer}.flasher`) || 0n;

																																																																																				      expect(flasherCurrentTokenBalance).toBe(flasherOriginalTokenBalance);
																																																																																				        });
});
