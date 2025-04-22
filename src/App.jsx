import React, { useState, useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";
import { PieChart } from "react-minimal-pie-chart";

const updateUsers = (setUsers, instance, accounts) => {
  if (accounts.length > 0) {
    setUsers([
      { displayName: "Connecting...", userPrincipalName: "Connecting.." },
    ]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch(
          "https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,extension_24a8955a629c4869b36185a566f48b4a_Admin",
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        )
          .then(async (res) => await res.json())
          .then((response) => {
            console.log(response.value);
            setUsers(response.value);
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }
};
function MyComponent() {
  const { instance, accounts } = useMsal();
  const [loginMenu, setLoginMenu] = useState();
  const [authenticatedUser, setUser] = useState();
  const [users, setUsers] = useState([]);
  const [editAdmins, openAdministrators] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState(true);
  const [selection, setSelection] = useState("");
  const [selector, setSelector] = useState("");
  const [generalLedger, setGeneralLedger] = useState(null);
  const [payoutLog, setPayoutLog] = useState(null);
  const [ioStatement, setIOStatement] = useState(null);
  const [ioMonths, setIOMonths] = useState([]);
  const [ioMonth, setIOMonth] = useState("");
  const [ioHover, setIOHover] = useState("");
  const [accountBalances, setAccountBalances] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        .then((response) => {
          fetch(
            `https://graph.microsoft.com/v1.0/users/${accounts[0].localAccountId}?$select=id,displayName,extension_24a8955a629c4869b36185a566f48b4a_Admin`,
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            }
          )
            .then(async (res) => await res.json())
            .then((response) => {
              console.log("authenticatedUser", response);
              setUser(response);
            })
            .catch((error) => {
              console.error(error);
            });
        });
    }
  }, [instance, accounts]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileView, setMobileView] = useState(true);
  const [tds, setTds] = useState([]);
  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);

  const displayTds = () => {
    let tdList = [];
    for (
      var i = 0;
      i <
      Math.floor(
        window.innerWidth < 500
          ? (window.innerWidth - tableWidth) / 60
          : (window.innerWidth - tableWidth - 300) / 60
      ) -
        2;
      i++
    ) {
      tdList.push(i);
    }
    setTds(tdList);
  };
  useEffect(() => {
    if (tableRef.current) setTableWidth(tableRef.current.offsetWidth);
    return () => {};
  }, [selection]);
  useEffect(() => {
    const handleResize = () => {
      setSelectionMenu(window.innerWidth < 500 ? false : true);
      //setMobileView(window.innerWidth < 500 ? true : false);
      setWindowWidth(window.innerWidth);
      //clearTimeout(timeout);
      displayTds();
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  function addCommas(numberString) {
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  const [scrollPosition, setScrollPosition] = useState(0);
  const [upOrder, setUpOrder] = useState(false);
  const [selectionHeight, setSelectionHeight] = useState(0);
  const [payoutTotals, setPayoutTotals] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setSelectionHeight(selectionMenuRef.current.offsetHeight);
      if (!(window.innerWidth < 500))
        if (window.scrollY > window.innerHeight) {
          //if (!mobileView)
          setMobileView(true);
          //
        }

      //setSelectionMenu(window.scrollY > window.innerHeight ? false : true);

      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    if (mobileView) window.scrollTo(0, selectionHeight - 100);
    //window.scrollTo(0, 0); //selectionHeight
    return () => {};
  }, [selectionHeight]);
  const selectionMenuRef = useRef(null);
  const [editCategory, setEditCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [maxHeightDivs, setMaxHeightsDivs] = useState(0);
  const getGeneralLedger = () => {
    if (mobileView) setSelectionMenu(false);
    setSelection("General Ledger");
    setGeneralLedger([{ Amount: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch("https://raifinancial.azurewebsites.net/api/generalledger", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + response.idToken,
            "Content-Type": "application/JSON",
          },
        })
          .then(async (res) => await res.json())
          .then(async (result) => {
            console.log(result);
            if (result.code === 401) {
              await instance.acquireTokenRedirect({
                account: accounts[0],
                forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setGeneralLedger([{ Amount: "please log in again..." }]);
            }
            const filteredGeneralLedger = result.generalLedger.filter((x) => {
              if (x.Category === "End of month balance") return false;
              return true;
            });
            const heights = filteredGeneralLedger.map((x) =>
              typeof x.Amount === "number" ? Math.abs(x.Amount) : 0
            );
            const maxHeightDivs = Math.max(...heights);
            //console.log(maxHeightDivs);
            setMaxHeightsDivs(maxHeightDivs);
            const generalLedger = filteredGeneralLedger.sort(
              (a, b) => new Date(b.Date) - new Date(a.Date)
            );
            setGeneralLedger(generalLedger);
          })
          .catch(() => {
            setGeneralLedger([{ Amount: "reload or log in again..." }]);
          });
      });
  };
  const [selectedIO, setSelectedIO] = useState("");
  const [revenue, setRevenue] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const space = " ";
  const [hoverEmail, setHoverEmail] = useState(false);
  const [hoverDiv, setHoverDiv] = useState(0);
  const [clickedDiv, setClickDiv] = useState(0);
  const [revenues, setRevenues] = useState([]);
  const [expensess, setExpensess] = useState([]);
  const [payoutChart, setPayoutChart] = useState([]);

  const [clickedPie, setClickPie] = useState(null);
  const [payoutLogSorted, setPayoutLogSorted] = useState([]);
  //console.log(tds);
  return (
    <div
      style={{
        display: mobileView ? "block" : "flex",
      }}
    >
      <div
        ref={selectionMenuRef}
        onMouseEnter={() => setClickDiv(0)}
        style={{
          display: mobileView ? "float" : "block",
          position: "relative",
          fontWeight: "bolder",
          color: "white",
          backgroundColor: "orange",
          width: mobileView ? "100vw" : "300px",
          height: mobileView ? "min-content" : "100vh",
          transition: ".3s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            cursor: "pointer",
            padding: "5px",
          }}
        >
          {!(windowWidth < 500) && (
            <div
              onClick={() => {
                setSelectionMenu(mobileView ? true : false);
                setMobileView(!mobileView);
              }}
              style={{
                right: "0px",
                position: "absolute",
                margin: "6px 0px",
                borderLeft: "4px solid white",
                borderBottom: "4px solid white",
                height: "20px",
                width: "20px",
                borderRadius: "5px",
                backgroundColor: "transparent",
                transform: "rotate(45deg)",
              }}
            ></div>
          )}
          {windowWidth < 500 && (
            <div
              onClick={() => {
                if (!mobileView) return null;
                setSelectionMenu(!selectionMenu);
              }}
            >
              <div
                style={{
                  borderRadius: "5px",
                  margin: "5px",
                  width: "30px",
                  height: "5px",
                  backgroundColor: "white",
                }}
              ></div>
              <div
                style={{
                  borderRadius: "5px",
                  margin: "5px",
                  width: "30px",
                  height: "5px",
                  backgroundColor: "white",
                }}
              ></div>
              <div
                style={{
                  borderRadius: "5px",
                  margin: "5px",
                  width: "30px",
                  height: "5px",
                  backgroundColor: "white",
                }}
              ></div>
            </div>
          )}
          <div style={{ padding: "10px" }}>RAI Finance</div>
        </div>
        <div
          style={{
            display: selectionMenu ? "block" : "none",
            textAlign: "center",
            margin: "10px",
            borderRadius: "8px",
            padding: "10px",
            backgroundColor: "rgba(250,250,250,0.25)",
          }}
        >
          {accounts[0] ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "block",
                  textAlign: "center",
                  borderRadius: "10px",
                  backgroundColor: "white",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    margin: "auto",
                    width: "10px",
                    height: "10px",
                    borderRadius: "10px",
                    backgroundColor: "orange",
                  }}
                ></div>
                <div
                  style={{
                    width: "20px",
                    height: "12px",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    backgroundColor: "orange",
                  }}
                ></div>
              </div>
              &nbsp;&nbsp;
              <div style={{ textAlign: "left" }}>
                {!accounts[0]
                  ? ""
                  : authenticatedUser &&
                    authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                  ? "Finance Admin"
                  : "User"}
                <br />
                <div
                  style={{
                    fontSize: "12px",
                  }}
                >
                  {accounts[0].username}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "block" }}>
              <button onClick={() => instance.loginPopup({ prompt: "login" })}>
                login
              </button>
              <br />
              <span
                style={{ cursor: "pointer", color: "dodgerblue" }}
                onClick={() => instance.loginPopup({ prompt: "create" })}
              >
                Sign up
              </span>
              {space}or make a{space}
              <a
                style={{ fontWeight: "bolder" }}
                href="https://signup.live.com"
              >
                microsoft account
              </a>
              {space}first.
            </div>
          )}
        </div>
        {!selectionMenu ? null : !authenticatedUser ? (
          <div style={{ padding: "0px 10px" }}>
            Must be logged in to view this page.
          </div>
        ) : !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin ? (
          <div style={{ padding: "0px 10px" }}>
            Must be an admin to view this page.
          </div>
        ) : (
          <div style={{ paddingBottom: "10px" }}>
            <div
              style={{
                cursor: "pointer",
                color: "white",
              }}
            >
              <div
                onMouseLeave={(e) => setSelector("")}
                onMouseEnter={(e) => setSelector("I/S")}
                style={{
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft: selection === "I/S" ? "2px solid white" : "",
                  padding: "3px 10px",
                  margin: "3px 10px",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "I/S" ? "rgba(250,250,250,.3)" : "",
                  textDecoration: selector === "I/S" ? "underline" : "none",
                  listStyleType: selector === "I/S" ? "initial" : "none",
                }}
                onClick={() => {
                  if (mobileView) setSelectionMenu(false);
                  setSelection("I/S");
                  setIOMonths(["Connecting to database..."]);
                  setIOStatement(null);
                  instance
                    .acquireTokenSilent({
                      ...loginRequest,
                      account: accounts[0],
                    })
                    .then((response) => {
                      fetch(
                        "https://raifinancial.azurewebsites.net/api/iostatement",
                        {
                          method: "GET",
                          headers: {
                            Authorization: "Bearer " + response.idToken,
                            "Content-Type": "application/JSON",
                          },
                        }
                      )
                        .then(async (res) => await res.json())
                        .then(async (result) => {
                          console.log(result);
                          if (result.code === 401) {
                            await instance.acquireTokenRedirect({
                              account: accounts[0],
                              forceRefresh: true,
                              refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                            });
                            return setIOStatement([
                              { TotalRevenue: "please log in again..." },
                            ]);
                          }
                          setIOMonths(
                            result.ioStatement
                              .sort(
                                (a, b) => new Date(b.Month) - new Date(a.Month)
                              )
                              .map((x, i) => {
                                if (i === 0) setIOMonth(x.Month);
                                return x.Month;
                              })
                          );
                          setIOStatement(result.ioStatement);
                        })
                        .catch(() => {
                          setIOStatement([
                            { TotalRevenue: "please log in again..." },
                          ]);
                        });
                    });
                }}
              >
                <div class="fas fa-home w-6"></div>&nbsp;&nbsp;I/S
              </div>
              <div
                onMouseEnter={(e) => setSelector("General Ledger")}
                style={{
                  padding: "3px 10px",
                  margin: "3px 10px",
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft:
                    selection === "General Ledger" ? "2px solid white" : "",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "General Ledger"
                      ? "rgba(250,250,250,.3)"
                      : "",
                  textDecoration:
                    selector === "General Ledger" ? "underline" : "none",
                  listStyleType:
                    selector === "General Ledger" ? "initial" : "none",
                }}
                onClick={getGeneralLedger}
              >
                <div class="fas fa-book w-6"></div>&nbsp;&nbsp;General Ledger
              </div>
              <div
                onMouseEnter={(e) => setSelector("Charts")}
                style={{
                  padding: "3px 10px",
                  margin: "3px 10px",
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft: selection === "Charts" ? "2px solid white" : "",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "Charts" ? "rgba(250,250,250,.3)" : "",
                  textDecoration: selector === "Charts" ? "underline" : "none",
                  listStyleType: selector === "Charts" ? "initial" : "none",
                }}
                onClick={() => {
                  if (mobileView) setSelectionMenu(false);
                  setSelection("Charts");
                }}
              >
                <div class="fas fa-chart-line w-6"></div>&nbsp;&nbsp;Charts
              </div>
              <div
                onMouseEnter={(e) => setSelector("Balances")}
                style={{
                  padding: "3px 10px",
                  margin: "3px 10px",
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft: selection === "Balances" ? "2px solid white" : "",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "Balances" ? "rgba(250,250,250,.3)" : "",
                  textDecoration:
                    selector === "Balances" ? "underline" : "none",
                  listStyleType: selector === "Balances" ? "initial" : "none",
                }}
                onClick={() => {
                  if (mobileView) setSelectionMenu(false);
                  setSelection("Balances");
                  setAccountBalances([
                    { CurrentBalance: "Connecting to database..." },
                  ]);
                  instance
                    .acquireTokenSilent({
                      ...loginRequest,
                      account: accounts[0],
                    })
                    .then((response) => {
                      fetch(
                        "https://raifinancial.azurewebsites.net/api/accountbalances",
                        {
                          method: "GET",
                          headers: {
                            Authorization: "Bearer " + response.idToken,
                            "Content-Type": "application/JSON",
                          },
                        }
                      )
                        .then(async (res) => await res.json())
                        .then(async (result) => {
                          console.log(result);
                          if (result.code === 401) {
                            await instance.acquireTokenRedirect({
                              account: accounts[0],
                              forceRefresh: true,
                              refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                            });
                            return setAccountBalances([
                              { CurrentBalance: "please log in again..." },
                            ]);
                          }
                          setAccountBalances(result.accountBalances);
                        })
                        .catch(() => {
                          setAccountBalances([
                            { CurrentBalance: "please log in again..." },
                          ]);
                        });
                    });
                }}
              >
                <div class="fas fa-wallet w-6"></div>&nbsp;&nbsp;Balances
              </div>
              <div
                onMouseEnter={(e) => setSelector("Payroll")}
                style={{
                  padding: "3px 10px",
                  margin: "3px 10px",
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft: selection === "Payroll" ? "2px solid white" : "",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "Payroll" ? "rgba(250,250,250,.3)" : "",
                  textDecoration: selector === "Payroll" ? "underline" : "none",
                  listStyleType: selector === "Payroll" ? "initial" : "none",
                }}
                onClick={() => {
                  if (mobileView) setSelectionMenu(false);
                  setSelection("Payroll");
                  setPayoutLog([{ EmployeeName: "Connecting to database..." }]);
                  instance
                    .acquireTokenSilent({
                      ...loginRequest,
                      account: accounts[0],
                    })
                    .then((response) => {
                      fetch(
                        "https://raifinancial.azurewebsites.net/api/payoutlog",
                        {
                          method: "GET",
                          headers: {
                            Authorization: "Bearer " + response.idToken,
                            "Content-Type": "application/JSON",
                          },
                        }
                      )
                        .then(async (res) => await res.json())
                        .then(async (result) => {
                          console.log(result);
                          if (result.code === 401) {
                            await instance.acquireTokenRedirect({
                              account: accounts[0],
                              forceRefresh: true,
                              refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                            });
                            return setPayoutLog([
                              { EmployeeName: "please log in again..." },
                            ]);
                          }

                          var payoutLog = result.payoutLog.map((x) => {
                            const employeeName =
                              x.EmployeeName.split("RTP Sent ")[1];
                            return {
                              ...x,
                              EmployeeName: employeeName.slice(
                                0,
                                employeeName.search(/\d/)
                              ),
                            };
                          });
                          var payoutTotals = [];
                          var totals = {};
                          payoutLog.forEach((x) => {
                            if (!totals[x.EmployeeName])
                              totals[x.EmployeeName] = 0;
                            //console.log(x.AmountPaid);
                            totals[x.EmployeeName] =
                              totals[x.EmployeeName] + x.AmountPaid;
                          });
                          setPayoutTotals(totals);
                          setPayoutChart(
                            Object.keys(totals).map((employeeName, i) => {
                              console.log(
                                employeeName,
                                Object.values(totals)[i]
                              );
                              return {
                                title: employeeName,
                                value: Object.values(totals)[i],
                                color: `rgb(${
                                  (i / Object.keys(totals).length) * 250
                                },${
                                  (i / Object.keys(totals).length) * 100 + 50
                                },${
                                  0 //(i / result.payoutLog.length) * 250
                                })`,
                              };
                            })
                          );
                          setPayoutLog(
                            payoutLog.sort(
                              (a, b) =>
                                new Date(b.PaymentDate) -
                                new Date(a.PaymentDate)
                            )
                          );
                          setPayoutLogSorted(
                            payoutLog.sort(
                              (a, b) =>
                                new Date(b.PaymentDate) -
                                new Date(a.PaymentDate)
                            )
                          );
                        })
                        .catch((e) => {
                          console.log(e);
                        });
                    });
                }}
              >
                <div class="fas fa-exchange-alt w-6"></div>&nbsp;&nbsp;Payroll
              </div>
              <div
                onMouseEnter={(e) => setSelector("Invoices")}
                style={{
                  padding: "3px 10px",
                  margin: "3px 10px",
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderLeft: selection === "Invoices" ? "2px solid white" : "",
                  transition: ".3s ease-in",
                  backgroundColor:
                    selection === "Invoices" ? "rgba(250,250,250,.3)" : "",
                  textDecoration:
                    selector === "Invoices" ? "underline" : "none",
                  listStyleType: selector === "Invoices" ? "initial" : "none",
                }}
                onClick={() => {
                  if (mobileView) setSelectionMenu(false);
                  setSelection("Invoices");
                }}
              >
                <div class="fas fa-file-alt w-6"></div>&nbsp;&nbsp;Invoices
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "oldlace",
          display: "block",
        }}
      >
        <div
          style={{
            cursor: "pointer",
            textIndent: "20px",
            padding: "20px 0px",
            width: mobileView ? "100%" : "calc(100vw - 300px)",
            color: "black",
            backgroundColor: "white",
          }}
        >
          <div
            onClick={() => setLoginMenu(true)}
            style={{
              transform: "translateY(-25%)",
              display: "flex",
              height: "40px",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "orange",
              borderRadius: "10px",
              position: "absolute",
              right: "0px",
              margin: "0px 10px",
            }}
          >
            <div
              style={{
                transform: "translateX(-25%)",
              }}
            >
              {accounts[0] ? accounts[0].username.substring(0, 2) : "UU"}
            </div>
          </div>
          <div
            style={{
              zIndex: 1,
              boxShadow: "-2px 5px 5px 1px grey",
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "10px",
              display: loginMenu ? "block" : "none",
              position: "absolute",
              right: "0px",
              margin: "0px 10px",
            }}
          >
            <div
              onClick={() => setLoginMenu(false)}
              style={{
                textIndent: "0px",
                cursor: "pointer",
                margin: "5px",
                textAlign: "center",
                borderRadius: "10px",
                height: "min-content",
                padding: "5px",
                border: "1px solid black",
              }}
            >
              x
            </div>
            {accounts.length > 0 ? (
              <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "block", margin: "0px 10px" }}>
                    <div
                      style={{
                        margin: "auto",
                        width: "10px",
                        height: "10px",
                        borderRadius: "10px",
                        backgroundColor: "orange",
                      }}
                    ></div>
                    <div
                      style={{
                        width: "20px",
                        height: "12px",
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "8px",
                        backgroundColor: "orange",
                      }}
                    ></div>
                  </div>
                  <p>{accounts[0].username}</p>
                </div>
                <button onClick={() => instance.logout()}>Log out</button>
                {!editAdmins ? (
                  <button
                    onClick={() => {
                      openAdministrators(true);
                      updateUsers(setUsers, instance, accounts);
                    }}
                  >
                    {authenticatedUser &&
                    authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                      ? "+/- edit admins"
                      : "View others"}
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        openAdministrators(false);
                      }}
                    >
                      - Close
                    </button>
                    <ul>
                      {users.map((user) => (
                        <li
                          style={{ wordWrap: "normal" }}
                          onClick={() => {
                            console.log(authenticatedUser, user);
                            if (
                              !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                            )
                              return null;
                            const answer =
                              //!user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                              window.confirm(
                                user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                  ? "Remove " +
                                      user.displayName +
                                      " as admin?" +
                                      (authenticatedUser.id === user.id
                                        ? " You will not have administrative privileges anymore."
                                        : "")
                                  : "Would you like to make " +
                                      user.displayName +
                                      " admin? This allows them to view financial statements and approve payroll."
                              );
                            if (answer) {
                              //|| user.extension_24a8955a629c4869b36185a566f48b4a_Admin) {
                              //https://www.reddit.com/r/sysadmin/comments/1gz9evy/entra_id_custom_attribute_on_user_record/
                              instance
                                .acquireTokenSilent({
                                  ...loginRequest,
                                  account: accounts[0],
                                })
                                .then((response) => {
                                  fetch(
                                    "https://graph.microsoft.com/v1.0/users/" +
                                      user.id,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${response.accessToken}`,
                                        "Content-Type": "application/JSON",
                                      },
                                      method: "PATCH",
                                      body: JSON.stringify({
                                        extension_24a8955a629c4869b36185a566f48b4a_Admin:
                                          user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                            ? false
                                            : true,
                                      }), //8705757a8c794156ac5f7a1bf13af481
                                      //0ccab800ce534413a0e8e3619f5fd1d1
                                    }
                                  )
                                    //.then(async (res) => await res.json())
                                    .then((response) => {
                                      console.log(response);

                                      updateUsers(setUsers, instance, accounts);
                                    })
                                    .catch((error) => {
                                      console.error(error);
                                    });
                                });
                            }
                          }}
                          key={user.id}
                        >
                          <span
                            onMouseEnter={() => {
                              setHoverEmail(user.userPrincipalName);
                            }}
                            onMouseLeave={() => {
                              setHoverEmail(false);
                            }}
                          >
                            {hoverEmail === user.userPrincipalName
                              ? user.userPrincipalName.split("#EXT#")[0]
                              : user.displayName}
                          </span>{" "}
                          {hoverEmail !== user.userPrincipalName &&
                            user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                            "(admin)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => instance.loginPopup({ prompt: "login" })}>
                Log in
              </button>
            )}
          </div>
          RAI Financial {selection}
        </div>
        {/*selection !== "" && (
          <div
            style={{
              margin: "10px",
              display: "flex",
            }}
            onClick={() => setSelection("")}
          >
            <div
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                border: "1px solid black",
                width: "min-content",
                textAlign: "center",
                padding: "0px 5px",
              }}
            >
              &times;
            </div>
            &nbsp;
            {selection}
          </div>
        )*/}
        <div
          style={{
            backgroundColor: "peachpuff",
          }}
        >
          {selection === "I/S" && (
            <div>
              <select
                style={{
                  margin: "10px",
                }}
                onChange={(e) => setIOMonth(e.target.value)}
              >
                {ioMonths.map((month) => {
                  const zeroPad = (x) => {
                    return x < 10 ? "0" + x : x;
                  };
                  return (
                    <option value={month} key={month}>
                      {month ===
                      new Date().getFullYear() +
                        "-" +
                        zeroPad(new Date().getMonth() + 1)
                        ? "Current Month"
                        : month}
                    </option>
                  );
                })}
              </select>
              <div
                style={{
                  width: mobileView ? "100vw" : "calc(100vw - 300px)",
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: "200px",
                }}
              >
                {ioStatement === null ? (
                  ""
                ) : ioStatement.length === 0 ? (
                  "No results"
                ) : (
                  <div style={{ display: "flex" }}>
                    <div
                      onClick={() => {
                        instance
                          .acquireTokenSilent({
                            ...loginRequest,
                            account: accounts[0],
                          })
                          .then((response) => {
                            setSelectedIO("revenue");
                            fetch(
                              "https://raifinancial.azurewebsites.net/api/revenue",
                              {
                                method: "GET",
                                headers: {
                                  Authorization: `Bearer ${response.idToken}`,
                                  "Content-Type": "application/JSON",
                                },
                              }
                            )
                              .then(async (res) => await res.json())
                              .then(async (result) => {
                                console.log(result);
                                if (result.code === 401) {
                                  await instance.acquireTokenRedirect({
                                    account: accounts[0],
                                    forceRefresh: true,
                                    refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                                  });
                                  return setRevenue([
                                    { Amount: "Sign in again..." },
                                  ]);
                                }
                                setRevenues(
                                  result.revenue.map((x) => x.Amount)
                                );
                                if (result.revenue)
                                  return setRevenue(result.revenue);
                                setRevenue([{ Amount: "Try again" }]);
                              })
                              .catch((error) => {
                                console.error(error);
                              });
                          });
                      }}
                      onMouseEnter={() => setIOHover("Revenue")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid orange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        margin: "20px",
                        marginRight: "0px",
                        textAlign: "left",
                        width: "200px",
                        padding: "40px 10px",
                        paddingTop: "30px",
                        boxShadow:
                          ioHover === "Revenue"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".3s ease-in",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        Revenue
                        <div
                          class="fas fa-chart-line"
                          style={{
                            margin: "4px",
                            color: "orange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder" }}>
                        $
                        {ioMonth !== "" &&
                          addCommas(
                            String(
                              ioStatement.find((x) => x.Month === ioMonth)
                                .TotalRevenue
                            )
                          )}
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedIO("expenses");
                        instance
                          .acquireTokenSilent({
                            ...loginRequest,
                            account: accounts[0],
                          })
                          .then((response) => {
                            fetch(
                              "https://raifinancial.azurewebsites.net/api/expenses",
                              {
                                method: "GET",
                                headers: {
                                  Authorization: `Bearer ${response.idToken}`,
                                  "Content-Type": "application/JSON",
                                },
                              }
                            )
                              .then(async (res) => await res.json())
                              .then(async (result) => {
                                console.log(result);
                                if (result.code === 401) {
                                  await instance.acquireTokenRedirect({
                                    account: accounts[0],
                                    forceRefresh: true,
                                    refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                                  });
                                  return setExpenses([
                                    { Amount: "Sign in again..." },
                                  ]);
                                }
                                setExpensess(
                                  result.expenses.map((x) => x.Amount)
                                );
                                result.expenses && setExpenses(result.expenses);
                              })
                              .catch((error) => {
                                console.error(error);
                              });
                          });
                      }}
                      onMouseEnter={() => setIOHover("Expenses")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid orange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        margin: "20px",
                        marginRight: "0px",
                        textAlign: "left",
                        width: "200px",
                        padding: "40px 10px",
                        paddingTop: "30px",
                        boxShadow:
                          ioHover === "Expenses"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".3s ease-in",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        Expenses
                        <div
                          class="fas fa-file-invoice-dollar"
                          style={{
                            margin: "4px",
                            color: "orange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder" }}>
                        $
                        {ioMonth !== "" &&
                          addCommas(
                            String(
                              ioStatement.find((x) => x.Month === ioMonth)
                                .TotalExpenses
                            )
                          )}
                      </div>
                    </div>
                    <div
                      onMouseEnter={() => setIOHover("Profit")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid orange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        margin: "20px",
                        marginRight: "0px",
                        textAlign: "left",
                        width: "200px",
                        padding: "40px 10px",
                        paddingTop: "30px",
                        boxShadow:
                          ioHover === "Profit"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".3s ease-in",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        Profit
                        <div
                          class="fas fa-wallet"
                          style={{
                            margin: "4px",
                            color: "orange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder" }}>
                        $
                        {ioMonth !== "" &&
                          addCommas(
                            String(
                              ioStatement.find((x) => x.Month === ioMonth)
                                .NetProfit
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedIO === "revenue" ? (
                <div>
                  {revenue !== null &&
                    revenue.map((x, i) => {
                      var total = 0;
                      revenues.forEach((amount) => {
                        total = total + amount;
                      });
                      return (
                        <div key={i} style={{ display: "block" }}>
                          <div>
                            ${addCommas(String(x.Amount))} ({x.Category})
                          </div>
                          <div
                            style={{
                              width: `${(x.Amount / total) * 100}%`,
                              height: "10px",
                              backgroundColor: "dodgerblue",
                            }}
                          ></div>
                        </div>
                      );
                    })}
                </div>
              ) : selectedIO === "expenses" ? (
                <div>
                  {expenses !== null &&
                    expenses.map((x, i) => {
                      var total = 0;
                      expensess.forEach((amount) => {
                        total = total + amount;
                      });
                      return (
                        <div key={i} style={{ display: "block" }}>
                          <div>
                            ${addCommas(String(x.Amount))} ({x.Category})
                          </div>
                          <div
                            style={{
                              width: `${(x.Amount / total) * 100}%`,
                              height: "10px",
                              backgroundColor: "dodgerblue",
                            }}
                          ></div>
                        </div>
                      );
                    })}
                </div>
              ) : null}
            </div>
          )}
          {selection === "General Ledger" && (
            <div
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                width: mobileView ? "100%" : "calc(100vw - 300px",
              }}
            >
              <div
                style={{
                  justifyContent: "flex-end",
                  transform: "scaleX(-1)",
                  //width: `calc(${mobileView ? "100vw" : "100vw - 300px"})`,
                  display: "flex",
                  height: "28px",
                  alignItems: "flex-end",
                }}
              >
                {generalLedger.map((x, i) => {
                  const width = windowWidth / generalLedger.length;
                  const height = x.Amount / maxHeightDivs;
                  //console.log(maxHeightDivs);
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => {
                        setHoverDiv(x.TransactionID);
                      }}
                      onMouseLeave={() => {
                        setHoverDiv(0);
                      }}
                      onClick={() => setClickDiv(x.TransactionID)}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          hoverDiv !== x.TransactionID
                            ? x.Amount >= 0
                              ? "green"
                              : "red"
                            : "black",
                        borderTopLeftRadius: "5px",
                        borderTopRightRadius: "5px",
                        width,
                        height: `${x.Amount < 0 ? 0 : height * 100}%`,
                        transition: ".2s ease-in",
                      }}
                    ></div>
                  );
                })}
              </div>
              <div
                style={{
                  justifyContent: "flex-end",
                  transform: "scaleX(-1)",
                  width: "100%",
                  display: "flex",
                  height: "28px",
                  alignItems: "flex-start",
                }}
              >
                {generalLedger.map((x, i) => {
                  const width = windowWidth / generalLedger.length;
                  const height = x.Amount / maxHeightDivs;
                  //console.log(maxHeightDivs);
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => {
                        setHoverDiv(x.TransactionID);
                      }}
                      onMouseLeave={() => {
                        setHoverDiv(0);
                      }}
                      onClick={() => setClickDiv(x.TransactionID)}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          hoverDiv !== x.TransactionID
                            ? x.Amount >= 0
                              ? "green"
                              : "red"
                            : "black",
                        borderBottomLeftRadius: "5px",
                        borderBottomRightRadius: "5px",
                        width,
                        height: `${
                          x.Amount >= 0 ? 0 : Math.abs(height) * 100
                        }%`,
                        transition: ".2s ease-in",
                      }}
                    ></div>
                  );
                })}
              </div>
              <div ref={tableRef}>
                <table>
                  {generalLedger !== null && generalLedger.length > 0 && (
                    <thead>
                      <tr>
                        <td
                          style={{
                            fontWeight: "bolder",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setGeneralLedger(
                              upOrder === "upDate"
                                ? generalLedger.reverse()
                                : generalLedger.sort(
                                    (a, b) =>
                                      new Date(a.Date) - new Date(b.Date)
                                  )
                            );
                            setUpOrder(upOrder ? false : "upDate");
                          }}
                        >
                          Date{" "}
                          {upOrder === "upDate" && (
                            <div
                              style={{
                                display: "inline-block",
                                margin: "6px 0px",
                                borderLeft: "4px solid black",
                                borderBottom: "4px solid black",
                                height: "6px",
                                width: "6px",
                                borderRadius: "3px",
                                backgroundColor: "transparent",
                                transform: `rotate(${
                                  upOrder ? "315" : "135"
                                }deg)`,
                              }}
                            ></div>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: "bolder",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setGeneralLedger(
                              upOrder === "upAmount"
                                ? generalLedger.reverse()
                                : generalLedger.sort(
                                    (a, b) => a.Amount - b.Amount
                                  )
                            );
                            setUpOrder(upOrder ? false : "upAmount");
                          }}
                        >
                          Amount{" "}
                          {upOrder === "upAmount" && (
                            <div
                              style={{
                                display: "inline-block",
                                margin: "6px 0px",
                                borderLeft: "4px solid black",
                                borderBottom: "4px solid black",
                                height: "6px",
                                width: "6px",
                                borderRadius: "3px",
                                backgroundColor: "transparent",
                                transform: `rotate(${
                                  upOrder ? "315" : "135"
                                }deg)`,
                              }}
                            ></div>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: "bolder",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setGeneralLedger(
                              upOrder === "upCategory"
                                ? generalLedger.reverse()
                                : generalLedger.sort((a, b) =>
                                    a.Category < b.Category ? 1 : -1
                                  )
                            );
                            setUpOrder(upOrder ? false : "upCategory");
                          }}
                        >
                          Category{" "}
                          {upOrder === "upCategory" && (
                            <div
                              style={{
                                display: "inline-block",
                                margin: "6px 0px",
                                borderLeft: "4px solid black",
                                borderBottom: "4px solid black",
                                height: "6px",
                                width: "6px",
                                borderRadius: "3px",
                                backgroundColor: "transparent",
                                transform: `rotate(${
                                  upOrder ? "315" : "135"
                                }deg)`,
                              }}
                            ></div>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: "bolder",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setGeneralLedger(
                              upOrder === "upPlatform"
                                ? generalLedger.reverse()
                                : generalLedger.sort((a, b) =>
                                    a.Platform < b.Platform ? 1 : -1
                                  )
                            );
                            setUpOrder(upOrder ? false : "upPlatform");
                          }}
                        >
                          Platform{" "}
                          {upOrder === "upPlatform" && (
                            <div
                              style={{
                                display: "inline-block",
                                margin: "6px 0px",
                                borderLeft: "4px solid black",
                                borderBottom: "4px solid black",
                                height: "6px",
                                width: "6px",
                                borderRadius: "3px",
                                backgroundColor: "transparent",
                                transform: `rotate(${
                                  upOrder ? "315" : "135"
                                }deg)`,
                              }}
                            ></div>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: "bolder",
                            cursor: "pointer",
                          }}
                        >
                          Description
                        </td>
                        {false &&
                          tds.map((x, i) => {
                            return (
                              <td key={i}>
                                <div
                                  style={{
                                    width: "60px",
                                  }}
                                ></div>
                              </td>
                            );
                          })}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {generalLedger === null
                      ? ""
                      : generalLedger.length === 0
                      ? "No results"
                      : generalLedger
                          .filter((x) => {
                            if (
                              clickedDiv !== 0 &&
                              clickedDiv !== x.TransactionID
                            )
                              return false;
                            return true;
                          })
                          .map((x, i) => {
                            return (
                              <tr
                                key={i + x.Date}
                                style={{
                                  backgroundColor:
                                    x.TransactionID === hoverDiv
                                      ? x.Amount >= 0
                                        ? "rgb(100,200,100,.3)"
                                        : "rgb(200,100,100,.3)"
                                      : "",
                                }}
                              >
                                <td>
                                  <div>
                                    {new Date(x.Date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    {typeof x.Amount === "number" ? (
                                      `$${addCommas(String(x.Amount))}`
                                    ) : x.Amount.split("reload")[1] ? (
                                      <span>
                                        <span
                                          style={{ color: "dodgerblue" }}
                                          onClick={() =>
                                            window.location.reload()
                                          }
                                        >
                                          reload
                                        </span>
                                        {x.Amount.split("reload")[1]}
                                      </span>
                                    ) : (
                                      addCommas(String(x.Amount))
                                    )}
                                  </div>
                                </td>
                                <td
                                  onClick={() => {
                                    if (editCategory === i) return null;
                                    setEditCategory(i);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  <div>
                                    {editCategory === i ? (
                                      <form
                                        style={{
                                          display: "flex",
                                        }}
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const answer = window.confirm(
                                            "Are you sure you'd like to change the Category from " +
                                              x.Category +
                                              " to " +
                                              newCategory +
                                              "?"
                                          );
                                          if (answer) {
                                            instance
                                              .acquireTokenSilent({
                                                ...loginRequest,
                                                account: accounts[0],
                                              })
                                              .then((response) => {
                                                fetch(
                                                  "https://raifinancial.azurewebsites.net/api/updatecategory/" +
                                                    x.TransactionID +
                                                    "/" +
                                                    newCategory,
                                                  {
                                                    method: "GET",
                                                    headers: {
                                                      Authorization: `Bearer ${response.idToken}`,
                                                      "Content-Type":
                                                        "application/JSON",
                                                    },
                                                  }
                                                )
                                                  .then(
                                                    async (res) =>
                                                      await res.json()
                                                  )
                                                  .then((response) => {
                                                    console.log(response);
                                                    setNewCategory("");
                                                    getGeneralLedger();
                                                    setEditCategory(false);
                                                  })
                                                  .catch((error) => {
                                                    console.error(error);
                                                  });
                                              });
                                          }
                                        }}
                                      >
                                        <input
                                          placeholder={x.Category}
                                          value={newCategory}
                                          onChange={(e) => {
                                            setNewCategory(e.target.value);
                                          }}
                                        />
                                        <div
                                          onClick={() => setEditCategory(false)}
                                        >
                                          &times;
                                        </div>
                                      </form>
                                    ) : (
                                      x.Category
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div>{x.Platform}</div>
                                </td>
                                <td>
                                  <div>{x.Description}</div>
                                </td>
                                {false &&
                                  tds.map((x, i) => {
                                    return (
                                      <td key={i}>
                                        <div
                                          style={{
                                            margin: "0px",
                                            width: "60px",
                                          }}
                                        ></div>
                                      </td>
                                    );
                                  })}
                              </tr>
                            );
                          })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selection === "Balances" && (
            <div
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                width: mobileView ? "100%" : "calc(100vw - 300px",
              }}
            >
              <table>
                {accountBalances !== null && accountBalances.length > 0 && (
                  <thead>
                    <tr>
                      <td>Account</td>
                      <td>Balance</td>
                      <td>Last Updated</td>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {accountBalances === null
                    ? ""
                    : accountBalances.length === 0
                    ? "No results"
                    : accountBalances.map((x) => {
                        return (
                          <tr key={x.LastUpdated}>
                            <td>{x.AccountName}</td>
                            <td>${addCommas(String(x.CurrentBalance))}</td>
                            <td>
                              {new Date(x.LastUpdated).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
          {selection === "Payroll" && (
            <div
              style={{
                alignItems: "flex-start",
                display: "flex",
                overflowX: "auto",
                overflowY: "hidden",
                width: mobileView ? "100%" : "calc(100vw - 300px",
              }}
            >
              <table>
                {payoutLog !== null && payoutLog.length > 0 && (
                  <thead>
                    <tr>
                      <td
                        style={{ fontWeight: "bolder", cursor: "pointer" }}
                        onClick={() => {
                          setPayoutLog(
                            upOrder === "upDate"
                              ? payoutLog.reverse()
                              : payoutLog.sort(
                                  (a, b) =>
                                    new Date(a.PaymentDate) -
                                    new Date(b.PaymentDate)
                                )
                          );
                          setUpOrder(upOrder ? false : "upDate");
                        }}
                      >
                        Date{" "}
                        {upOrder === "upDate" && (
                          <div
                            style={{
                              display: "inline-block",
                              margin: "6px 0px",
                              borderLeft: "4px solid black",
                              borderBottom: "4px solid black",
                              height: "6px",
                              width: "6px",
                              borderRadius: "3px",
                              backgroundColor: "transparent",
                              transform: `rotate(${
                                upOrder ? "315" : "135"
                              }deg)`,
                            }}
                          ></div>
                        )}
                      </td>
                      <td
                        style={{ fontWeight: "bolder", cursor: "pointer" }}
                        onClick={() => {
                          setPayoutLog(
                            upOrder === "upEmployee"
                              ? payoutLog.reverse()
                              : payoutLog.sort((a, b) =>
                                  a.EmployeeName < b.EmployeeName ? 1 : -1
                                )
                          );
                          setUpOrder(upOrder ? false : "upEmployee");
                        }}
                      >
                        Employee{" "}
                        {upOrder === "upEmployee" && (
                          <div
                            style={{
                              display: "inline-block",
                              margin: "6px 0px",
                              borderLeft: "4px solid black",
                              borderBottom: "4px solid black",
                              height: "6px",
                              width: "6px",
                              borderRadius: "3px",
                              backgroundColor: "transparent",
                              transform: `rotate(${
                                upOrder ? "315" : "135"
                              }deg)`,
                            }}
                          ></div>
                        )}
                      </td>
                      <td
                        style={{ fontWeight: "bolder", cursor: "pointer" }}
                        onClick={() => {
                          setPayoutLog(
                            upOrder === "upAmount"
                              ? payoutLog.reverse()
                              : payoutLog.sort((a, b) =>
                                  a.AmountPaid < b.AmountPaid ? 1 : -1
                                )
                          );
                          setUpOrder(upOrder ? false : "upAmount");
                        }}
                      >
                        Amount{" "}
                        {upOrder === "upAmount" && (
                          <div
                            style={{
                              display: "inline-block",
                              margin: "6px 0px",
                              borderLeft: "4px solid black",
                              borderBottom: "4px solid black",
                              height: "6px",
                              width: "6px",
                              borderRadius: "3px",
                              backgroundColor: "transparent",
                              transform: `rotate(${
                                upOrder ? "315" : "135"
                              }deg)`,
                            }}
                          ></div>
                        )}
                      </td>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {payoutLog === null
                    ? ""
                    : payoutLog.length === 0
                    ? "No results"
                    : payoutLog.map((x, i) => {
                        return (
                          (clickedPie === null ||
                            x.EmployeeName === clickedPie) && (
                            <tr key={i + x.CreatedAt}>
                              <td>
                                <div>
                                  {new Date(x.PaymentDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>{x.EmployeeName}</div>
                              </td>
                              <td>
                                <div>${addCommas(String(x.AmountPaid))}</div>
                              </td>
                            </tr>
                          )
                        );
                      })}
                </tbody>
              </table>
              <div
                style={{
                  margin: "20px 60px",
                  minWidth: "300px",
                }}
              >
                <PieChart
                  data={payoutChart}
                  onClick={(e, segmentIndex) => {
                    const employeeName = Object.keys(payoutTotals).find(
                      (x, i) => {
                        //console.log(segmentIndex, i);
                        return i === segmentIndex;
                      }
                    );
                    //console.log(employeeName);
                    setClickPie(employeeName);
                  }}
                  //radius={100}
                />
              </div>
            </div>
          )}
        </div>
        {selection !== "" && (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => {
              setClickDiv(0);
              setClickPie(null);
            }}
          >
            {clickedDiv !== 0 || clickedPie !== null
              ? "See all."
              : "End of results."}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComponent;
