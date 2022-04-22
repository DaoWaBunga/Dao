import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeApproval, changeDeposit, changeClaim } from "../../slices/PresaleThunk";
import { addresses } from "../../constants";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import {
  Paper,
  Grid,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  SvgIcon,
  Link,
} from "@material-ui/core";
import "./style.scss";
import { ReactComponent as ohmTokenImg } from "../../assets/tokens/token_OHM.svg";
import contractImg from "src/assets/icons/pngegg.png";
import DisChart from './DisChart'
import { shorten } from "../../helpers";
import { error } from "../../slices/MessagesSlice";
import { ethers, BigNumber } from "ethers";

function Presale() {
  const dispatch = useDispatch();
  const { provider, address, connected, connect, chainID } = useWeb3Context();
  const networkID = chainID;
  const DAWA_ADDRESS = addresses[networkID].HEC_ADDRESS;
  const PRESALE_ADDRESS = addresses[networkID].PRESALE_ADDRESS;
  const [quantity, setQuantity] = useState("");

  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });
  const busdBalance = useSelector(state => {
    return state.account.balances && state.account.balances.busd;
  });
  const setMax = () => {
    setQuantity(busdBalance);
  };
  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };
  const presaleAllowance = useSelector(state => {
    return state.account.presale && state.account.presale.presaleAllowance;
  });
  const price = useSelector(state => {
    return state.account.presale && state.account.presale.price;
  });
  const capable = useSelector(state => {
    return state.account.presale && state.account.presale.capable;
  });
  const started = useSelector(state => {
    return state.account.presale && state.account.presale.started;
  });
  const ended = useSelector(state => {
    return state.account.presale && state.account.presale.ended;
  });
  const claimable = useSelector(state => {
    return state.account.presale && state.account.presale.claimable;
  });
  const userInfo = useSelector(state => {
    return state.account.presale && state.account.presale.userInfo;
  });

  const onChangeDeposit = async action => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(quantity) || quantity === 0 || quantity === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(quantity, "ether");

    if (action === "presale" && gweiValue.gt(ethers.utils.parseUnits(busdBalance, "ether"))) {
      return dispatch(error("You cannot deposit more than your BUSD balance."));
    }
    await dispatch(changeDeposit({ address, action, value: quantity.toString(), provider, networkID: chainID }));
  };
  const onChangeClaim = async action => {
    await dispatch(changeClaim({ address, action, provider, networkID: chainID }));
  };
  const hasAllowance = useCallback(
    token => {
      if (token === "busd") return presaleAllowance > 0;
      return 0;
    },
    [presaleAllowance],
  );
  const isAllowanceDataLoading = presaleAllowance == null;
  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      Connect Wallet
    </Button>
  );

  return (
    <div id="presale-view">
        <Grid item className={`ohm-card`}>
            <div className="stake-top-metrics">
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Paper className="presale-card">
                    <Typography variant="body1" className="presale-note" color="textSecondary">
                      {ended ? 
                      <>
                      Presale is over
                      </> : started ? <>
                        Presale is live
                      </> :
                      <>
                      Presale is not open yet
                      </>}
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      Contribute To Get DAWA<br/><br/>
                    </Typography>
                    <div className="claimarea">
                      {!isAllowanceDataLoading ? (
                        <>
                        {/* <Grid item xs={12} sm={2} md={2} lg={2} /> */}
                        <Grid item xs={12} sm={6} md={6} lg={6}>
                          <FormControl className="deposit-input" variant="outlined">
                            <InputLabel htmlFor="amount-input"></InputLabel>
                            <OutlinedInput
                              id="amount-input"
                              type="number"
                              placeholder="Enter an amount"
                              className="stake-input"
                              value={quantity}
                              width="70%"
                              onChange={e => setQuantity(e.target.value)}
                              labelWidth={0}
                              endAdornment={
                                <InputAdornment position="end">
                                  <Button variant="text" onClick={setMax} color="inherit">
                                    Max
                                  </Button>
                                </InputAdornment>
                              }
                            />
                          </FormControl>
                        </Grid>
                        </>
                        ) : (
                        null
                      )}

                      {isAllowanceDataLoading ? (
                        <div className="stake-wallet-notification">
                          <div className="wallet-menu" id="wallet-menu">
                            {modalButton}
                          </div>
                        </div>
                      ) : started || ended ? (
                        null
                      ) : hasAllowance("busd") ? (
                        <>
                        {/* <Grid item xs={12} sm={1} md={1} lg={1} /> */}
                        <Grid item xs={12} sm={6} md={6} lg={6}>
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "deposit")}
                            onClick={() => {
                              onChangeDeposit("presale");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "deposit", "Deposit BUSD")}
                          </Button>
                        </Grid>
                        </>
                      ) : (
                        <>
                        {/* <Grid item xs={12} sm={1} md={1} lg={1} /> */}
                        <Grid item xs={12} sm={6} md={6} lg={6}>
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "approve_deposit")}
                            onClick={() => {
                              onSeekApproval("busd");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "approve_deposit", "Approve")}
                          </Button>
                        </Grid>
                        </>
                      )}
                    </div>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Paper className="presale-card">
                    <Typography variant="h6" color="textSecondary">
                      PreSale allocation remaining
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      2500,000 BUSD<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      Presale status note
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      Not Started Yet<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      Whitelist presale starts in:
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      05:30:00<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      Public presale starts in:
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      05:30:00
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Paper className="presale-card">
                    <Typography variant="h6" color="textSecondary">
                    Price(Per DAWA):
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      10 BUSD<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                    Total hard cap:
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      2,500,000 BUSD<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                    Max buy/account:
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      2,500 BUSD<br/><br/>
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      Avaiable Just For You:
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      100 BUSD
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Paper className="presale-card">
                    <Typography variant="h6" className="puretext">
                      40% of presale funds —{'>'} Initial liquidity <br/>
                      Liquidity added at 2x presale price ($20/MP) if presale sells out <br/>
                      75% of initial liquidity will be hosted on SpookySwap and audited as protocol Treasury reserves <br/>
                      25% of intial liquidity will be hosted on Knight Swap and be locked for 3 months <br/>
                      Any unsold presale tokens, and an equal amount of DAO tokens, will be burned
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Paper className="presale-card">
                    <DisChart/>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={6}>
                  <Paper className="presale-card contract-area" >
                    <div className="contract-area">
                      <SvgIcon
                        component={ohmTokenImg}
                        viewBox="0 0 100 100"
                        style={{ height: "70px", width: "70px", marginTop: "7px" }}
                      />
                      <Typography variant="h6" className="puretext">
                        <p>DAWA Token Address</p>
                        <Link href={`https://bscscan.com/address/${DAWA_ADDRESS}`} target="_blank">{shorten(DAWA_ADDRESS, 1)}</Link>
                      </Typography>
                    </div>
                    <div className="contract-area">
                      <img src={contractImg} height="70px" width= "70px" style={{ marginTop: "7px" }}/>
                      <Typography variant="h6" className="puretext">
                        <p>Presale Contract Address</p>
                        <Link href={`https://bscscan.com/address/${PRESALE_ADDRESS}`} target="_blank">{shorten(PRESALE_ADDRESS, 1)}</Link>
                      </Typography>
                    </div>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Paper className="presale-card">
                    <Typography variant="h6" color="textSecondary">
                      Starts in: 03:20:17
                    </Typography>
                    <Typography variant="h4" color="textSecondary">
                      Cliam Your DAWA Tokens<br/><br/>
                    </Typography>
                    <div className="claimarea">
                    <Grid item xs={6} sm={6} md={6} lg={6}>
                      <Typography variant="h6" color="textSecondary">
                        Claimable Amount : {userInfo ? ethers.utils.formatUnits(userInfo.debt, "gwei") : 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={6} md={6} lg={6}>
                      <Button
                        className="stake-button"
                        variant="contained"
                        color="primary"
                        disabled={isPendingTxn(pendingTransactions, "claim")}
                        onClick={() => {
                          onChangeClaim("claim");
                        }}
                      >
                        {txnButtonText(pendingTransactions, "claim", "Claim DAWA")}
                      </Button>
                    </Grid>
                    </div>
                  </Paper>
                </Grid>
              </Grid>
            </div>
        </Grid>
    </div>
  );
}

export default Presale;
