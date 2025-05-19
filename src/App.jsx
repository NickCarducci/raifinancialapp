import React, { useState, useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";
import { PieChart } from "react-minimal-pie-chart";
import { Bar } from "react-chartjs-2";
import {
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Chart,
} from "chart.js";
import { usePlaidLink } from "react-plaid-link";

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

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
      })
      .catch((error) => {
        console.error(error);
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
  const [selection, setSelection] = useState("I/S");
  const [selector, setSelector] = useState("");
  const [generalLedger, setGeneralLedger] = useState(null);
  const [payoutLog, setPayoutLog] = useState(null);
  const [ioStatement, setIOStatement] = useState(null);
  const [ioMonths, setIOMonths] = useState([]);
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
        })
        .catch((error) => {
          //window.location.reload();
          instance.logoutRedirect({
            account: accounts[0],
            mainWindowRedirectUri: window.location.href,
          });
          console.error(error);
        });
    }
  }, [instance, accounts]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileView, setMobileView] = useState(false);
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
      if (window.innerWidth < 500) {
        setSelectionMenu(false);
        setMobileView(true);
      } else {
        setSelectionMenu(true);
        setMobileView(false);
      }
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
      //if (!(window.innerWidth < 500))
      if (window.scrollY > window.innerHeight)
        if (!mobileView) {
          if (selection !== "I/S") {
            //setMobileView(true);
          }
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
    //if (mobileView) window.scrollTo(0, selectionHeight - 100);
    //window.scrollTo(0, 0); //selectionHeight
    return () => {};
  }, [selectionHeight]);
  const selectionMenuRef = useRef(null);
  const [editCategory, setEditCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [maxHeightDivs, setMaxHeightsDivs] = useState(0);
  const [generalLedgerTicks, setGeneralLedgerTicks] = useState([]);
  const [lastStartingDate, setLastStartingDate] = useState("");
  const [lastEndingDate, setLastEndingDate] = useState("");
  const getGeneralLedger = () => {
    if (mobileView) setSelectionMenu(false);
    setGeneralLedger([{ Amount: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        setLastStartingDate(startingDate);
        setLastEndingDate(endingDate);
        const newStartingDate = new Date(
          new Date(startingDate).getTime() + 86400000 * 2
        );
        const newEndingDate = new Date(
          new Date(endingDate).getTime() + 86400000 * 2
        );
        fetch(
          "https://raifinancial.azurewebsites.net/api/generalledger/" +
            newStartingDate.getFullYear() +
            "-" +
            String(newStartingDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(newStartingDate.getDate()).padStart(2, "0") +
            "/" +
            newEndingDate.getFullYear() +
            "-" +
            String(newEndingDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(newEndingDate.getDate()).padStart(2, "0"),
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
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setGeneralLedger([{ Amount: "please log in again..." }]);
            }
            const generalLedger = result.generalLedger
              .filter((x) => {
                if (x.Category === "End of month balance") return false;
                return true;
              })
              .sort((a, b) => new Date(b.Date) - new Date(a.Date));
            var generalLedgerTicks = [];
            generalLedger.forEach((x, i) => {
              var found = generalLedgerTicks.find(
                (y) => y[x.Date.split("T")[0]]
              );
              if (!found)
                generalLedgerTicks.push({
                  [x.Date.split("T")[0]]: 0,
                });
              generalLedgerTicks = generalLedgerTicks.filter(
                (y) => Object.keys(y)[0] !== x.Date.split("T")[0]
              );
              generalLedgerTicks.push({
                [x.Date.split("T")[0]]:
                  (found ? Object.values(found)[0] : 0) + x.Amount,
              });
              //console.log(generalLedgerTicks);
            });
            //console.log(generalLedgerTicks);
            setGeneralLedgerTicks(generalLedgerTicks);
            const heights = generalLedgerTicks.map((x) => {
              const amount = Object.values(x)[0];
              return typeof amount === "number" ? Math.abs(amount) : 0;
            });
            const maxHeightDivs = Math.max(...heights);
            setMaxHeightsDivs(maxHeightDivs);
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
  const [hoverDiv, setHoverDiv] = useState("");
  const [hoverDivs, setHoverDivs] = useState(false);
  const [clickedDiv, setClickDiv] = useState("");
  const [revenueAmounts, setRevenueAmounts] = useState([]);
  const [expensesAmounts, setExpensesAmounts] = useState([]);
  const [payoutChart, setPayoutChart] = useState([]);

  const [clickedPie, setClickPie] = useState(null);
  function getStartOfMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    return `${year}-${month}-01`;
  }
  function getEndOfMonth(date) {
    var fullYear = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var lastDayOfMonth = new Date(fullYear, month, 0).getDate();
    //console.log(`${fullYear}-${month}-${lastDayOfMonth}`);
    return `${fullYear}-${month}-${lastDayOfMonth}`;
  }
  const [startingDate, setStartingDate] = useState(
    getStartOfMonth(new Date()) //new Date().toISOString().split("T")[0]
  );
  const [endingDate, setEndingDate] = useState(getEndOfMonth(new Date()));
  //console.log(tds);
  const pieChart = () => (
    <PieChart
      data={payoutChart}
      onClick={(e, segmentIndex) => {
        const employeeName = Object.keys(payoutTotals).find((x, i) => {
          //console.log(segmentIndex, i);
          return i === segmentIndex;
        });
        //console.log(employeeName);
        setClickPie(employeeName);
      }}
      //radius={100}
      lineWidth={80}
    />
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState("Monthly");
  var quarterlyIOStatement = [];
  var annualIOStatement = [];
  const pieChartColors = [
    "salmon",
    "red",
    "darkorange",
    "pink",
    "black",
    "blue",
    "aquamarine",
    "cadetblue",
    "darkgreen",
    "cornsilk",
    "orangered",
    "palegreen",
    "royalblue",
  ];
  var barChartData = null;
  if (ioStatement) {
    ioStatement.forEach((x) => {
      const month = String(
        new Date(new Date(x.Month).getTime() + 86400000 * 6).getMonth() + 1
      ).padStart(2, "0");
      const year = new Date(x.Month).getFullYear();
      const thisQuarter = ["01", "02", "03"].includes(month)
        ? year + "-Q1"
        : ["04", "05", "06"].includes(month)
        ? year + "-Q2"
        : ["07", "08", "09"].includes(month)
        ? year + "-Q3"
        : ["10", "11", "12"].includes(month)
        ? year + "-Q4"
        : "";
      const found = quarterlyIOStatement.find((y) =>
        thisQuarter === y.Quarter ? true : false
      );
      quarterlyIOStatement = quarterlyIOStatement.filter(
        (y) => y.Quarter !== thisQuarter
      );
      quarterlyIOStatement.push(
        found
          ? {
              ...found,
              Revenue: found.Revenue + x.Revenue,
              Expenses: found.Expenses + x.Expenses,
              NetProfit: found.NetProfit + x.NetProfit,
            }
          : { ...x, Quarter: thisQuarter }
      );
    });
    ioStatement.forEach((x) => {
      const year = new Date(
        new Date(x.Month).getTime() + 86400000 * 6
      ).getFullYear();
      const found = annualIOStatement.find((y) =>
        year === y.Year ? true : false
      );
      if (!found)
        annualIOStatement.push({
          NetProfit: 0,
          Revenue: 0,
          Expenses: 0,
          Year: year,
        });
      annualIOStatement = annualIOStatement.filter((y) => y.Year !== year);
      annualIOStatement.push(
        found
          ? {
              ...found,
              Revenue: found.Revenue + x.Revenue,
              Expenses: found.Expenses + x.Expenses,
              NetProfit: found.NetProfit + x.NetProfit,
            }
          : { ...x, Year: year }
      );
    });
    barChartData = {
      labels:
        selectedFrequency === "Monthly"
          ? ioStatement
              .map((x) => {
                return getEndOfMonth(
                  new Date(new Date(x.Month).getTime() + 86400000 * 6)
                );
              })
              .reverse()
          : selectedFrequency === "Quarterly"
          ? quarterlyIOStatement
              .map((x) => {
                return x.Quarter;
              })
              .reverse()
          : selectedFrequency === "Yearly"
          ? annualIOStatement
              .map((x) => {
                return x.Year;
              })
              .reverse()
          : [],
      datasets: [
        {
          label: "Revenue",
          data: (selectedFrequency === "Monthly"
            ? ioStatement
            : selectedFrequency === "Quarterly"
            ? quarterlyIOStatement
            : selectedFrequency === "Yearly"
            ? annualIOStatement
            : []
          )
            .map((x) => {
              //console.log(x.Revenue);
              return x.Revenue;
            })
            .reverse(),
          borderWidth: 1,
          backgroundColor: "sandybrown",
        },
        {
          label: "Expenses",
          data: (selectedFrequency === "Monthly"
            ? ioStatement
            : selectedFrequency === "Quarterly"
            ? quarterlyIOStatement
            : selectedFrequency === "Yearly"
            ? annualIOStatement
            : []
          )
            .map((x) => {
              //console.log(x.Revenue);
              return x.Expenses;
            })
            .reverse(),
          borderWidth: 1,
          backgroundColor: "salmon",
        },
      ],
    };
  }
  const io =
    selectedFrequency === "Monthly"
      ? ioStatement
      : selectedFrequency === "Quarterly"
      ? quarterlyIOStatement
      : selectedFrequency === "Yearly"
      ? annualIOStatement
      : [];
  var lastMonthsIOStatement = {};
  //console.log(io);
  const thisMonthsIOStatement = !ioStatement
    ? null
    : io.find((x, i) => {
        const go =
          selectedFrequency === "Monthly"
            ? getEndOfMonth(
                new Date(new Date(x.Month).getTime() + 86400000 * 6)
              ) === selectedDate
            : selectedFrequency === "Quarterly"
            ? x.Quarter === selectedDate
            : selectedFrequency === "Yearly"
            ? x.Year === selectedDate
            : false;
        if (go) lastMonthsIOStatement = io.find((y, ii) => ii === i + 1);
        //console.log(x);
        return go;
      });
  //console.log(thisMonthsIOStatement, selectedDate);
  const changeInTotalRevenue =
    thisMonthsIOStatement && lastMonthsIOStatement
      ? (
          ((Math.abs(thisMonthsIOStatement.Revenue) -
            Math.abs(lastMonthsIOStatement.Revenue)) /
            lastMonthsIOStatement.Revenue) *
          100
        ).toFixed(1)
      : 0;
  const changeInTotalExpenses =
    thisMonthsIOStatement && lastMonthsIOStatement
      ? (
          ((Math.abs(thisMonthsIOStatement.Expenses) -
            Math.abs(lastMonthsIOStatement.Expenses)) /
            lastMonthsIOStatement.Expenses) *
          100
        ).toFixed(1)
      : 0;
  const changeInNetProfit =
    thisMonthsIOStatement && lastMonthsIOStatement
      ? (
          ((Math.abs(thisMonthsIOStatement.NetProfit) -
            Math.abs(lastMonthsIOStatement.NetProfit)) /
            lastMonthsIOStatement.NetProfit) *
          100
        ).toFixed(1)
      : 0;
  const getRevenue = () => {
    setSelectedIO("revenue");
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        setRevenue([
          { Category: "Connecting to database...", Amount: 0, Color: "black" },
        ]);
        fetch("https://raifinancial.azurewebsites.net/api/revenue", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${response.idToken}`,
            "Content-Type": "application/JSON",
          },
        })
          .then(async (res) => await res.json())
          .then(async (result) => {
            console.log(result);
            if (result.code === 401) {
              await instance.acquireTokenRedirect({
                account: accounts[0],
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setRevenue([{ Amount: "Sign in again..." }]);
            }
            var revenueByQuarter = [];
            var revenueByYear = [];
            result.revenue.forEach((x) => {
              const thisQuarter =
                new Date(x.Date).getFullYear() +
                {
                  "01": "-Q1",
                  "02": "-Q1",
                  "03": "-Q1",
                  "04": "-Q2",
                  "05": "-Q2",
                  "06": "-Q2",
                  "07": "-Q3",
                  "08": "-Q3",
                  "09": "-Q3",
                  10: "-Q4",
                  11: "-Q4",
                  12: "-Q4",
                }[
                  String(
                    new Date(
                      new Date(x.Date).getTime() + 86400000 * 5
                    ).getMonth() + 1
                  ).padStart(2, "0")
                ];
              const found = revenueByQuarter.find(
                (y) => y.Quarter === thisQuarter && y.Category === x.Category
              );

              if (!found)
                revenueByQuarter.push({
                  ...x,
                  Quarter: thisQuarter,
                });
              revenueByQuarter = revenueByQuarter.filter(
                (y) => y.Quarter !== thisQuarter || y.Category !== x.Category
              );
              revenueByQuarter.push({
                ...x,
                Amount: (found ? found.Amount : 0) + x.Amount,
                Quarter: thisQuarter,
              });
              const year = new Date(x.Date).getFullYear();
              const found1 = revenueByYear.find(
                (y) => y.Year === year && y.Category === x.Category
              );
              if (!found1)
                revenueByYear.push({
                  ...x,
                  Year: year,
                });
              revenueByYear = revenueByYear.filter(
                (y) => y.Year !== year || y.Category !== x.Category
              );
              revenueByYear.push({
                ...x,
                Amount: (found1 ? found1.Amount : 0) + x.Amount,
                Year: year,
              });
            });
            setRevenueAmountsByYear(revenueByYear.map((x) => x.Amount));
            setRevenueAmountsByQuarter(revenueByQuarter.map((x) => x.Amount));
            setRevenueAmounts(result.revenue.map((x) => x.Amount));
            setRevenueMonthsByYear(
              [...new Set(revenueByYear.map((x) => x.Year))].reverse()
            );
            setRevenueMonthsByQuarter(
              [...new Set(revenueByQuarter.map((x) => x.Quarter))].reverse()
            );
            setRevenueMonths(
              [
                ...new Set(
                  result.revenue.map((x, i) => {
                    const date = getEndOfMonth(
                      new Date(new Date(x.Date).getTime() + 86400000 * 5)
                    );
                    //if (i === result.revenue.length - 1) setSelectedDate(date);
                    return date;
                  })
                ),
              ].reverse()
            );
            if (result.revenue) {
              setRevenueByYear(revenueByYear);
              setRevenueByQuarter(revenueByQuarter);
              return setRevenue(result.revenue);
            }
            setRevenue([{ Category: "Try again", Amount: 0, Color: "black" }]);
          })
          .catch((error) => {
            setRevenue([{ Category: "Try again", Amount: 0, Color: "black" }]);
            console.error(error);
          });
      });
  };
  const getExpenses = () => {
    setSelectedIO("expenses");
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        setExpenses([
          { Category: "Connecting to database...", Amount: 0, Color: "black" },
        ]);
        fetch("https://raifinancial.azurewebsites.net/api/expenses", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${response.idToken}`,
            "Content-Type": "application/JSON",
          },
        })
          .then(async (res) => await res.json())
          .then(async (result) => {
            console.log(result);
            if (result.code === 401) {
              await instance.acquireTokenRedirect({
                account: accounts[0],
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setExpenses([
                { Category: "Sign in again...", Amount: 0, Color: "black" },
              ]);
            }
            var expensesByQuarter = [];
            var expensesByYear = [];
            result.expenses.forEach((x) => {
              const thisQuarter =
                new Date(x.Date).getFullYear() +
                {
                  "01": "-Q1",
                  "02": "-Q1",
                  "03": "-Q1",
                  "04": "-Q2",
                  "05": "-Q2",
                  "06": "-Q2",
                  "07": "-Q3",
                  "08": "-Q3",
                  "09": "-Q3",
                  10: "-Q4",
                  11: "-Q4",
                  12: "-Q4",
                }[
                  String(
                    new Date(
                      new Date(x.Date).getTime() + 86400000 * 5
                    ).getMonth() + 1
                  ).padStart(2, "0")
                ];

              const found = expensesByQuarter.find(
                (y) => y.Quarter === thisQuarter && y.Category === x.Category
              );
              if (!found)
                expensesByQuarter.push({
                  ...x,
                  Quarter: thisQuarter,
                });
              expensesByQuarter = expensesByQuarter.filter(
                (y) => y.Quarter !== thisQuarter || y.Category !== x.Category
              );
              expensesByQuarter.push({
                ...x,
                Amount: (found ? found.Amount : 0) + x.Amount,
                Quarter: thisQuarter,
              });
              const year = new Date(x.Date).getFullYear();
              const found1 = expensesByYear.find(
                (y) => y.Year === year && y.Category === x.Category
              );
              if (!found1)
                expensesByYear.push({
                  ...x,
                  Year: year,
                });
              expensesByYear = expensesByYear.filter(
                (y) => y.Year !== year || y.Category !== x.Category
              );
              expensesByYear.push({
                ...x,
                Amount: (found1 ? found1.Amount : 0) + x.Amount,
                Year: year,
              });
            });
            setExpensesAmountsByYear(expensesByYear.map((x) => x.Amount));
            setExpensesAmountsByQuarter(expensesByQuarter.map((x) => x.Amount));
            setExpensesAmounts(result.expenses.map((x) => x.Amount));
            setExpensesMonthsByYear(
              [...new Set(expensesByYear.map((x) => x.Year))].reverse()
            );
            setExpensesMonthsByQuarter(
              [...new Set(expensesByQuarter.map((x) => x.Quarter))].reverse()
            );
            setExpensesMonths(
              [
                ...new Set(
                  result.expenses.map((x, i) => {
                    const date = getEndOfMonth(
                      new Date(new Date(x.Date).getTime() + 86400000 * 5)
                    );
                    //if (i === result.expenses.length - 1) setSelectedDate(date);
                    return date;
                  })
                ),
              ].reverse()
            );
            if (result.expenses) {
              setExpensesByYear(expensesByYear);
              setExpensesByQuarter(expensesByQuarter);
              return setExpenses(result.expenses);
            }
            setExpenses([{ Category: "Try again", Amount: 0, Color: "black" }]);
          })
          .catch((error) => {
            setExpenses([{ Category: "Try again", Amount: 0, Color: "black" }]);
            console.error(error);
          });
      });
  };
  const [bankAccounts, setBankAccounts] = useState([]);
  const [needsRelink, setNeedsRelink] = useState(false);

  const [linkTokenPlaid, setLinkToken] = useState(null);
  const config = {
    token: linkTokenPlaid,
    onSuccess: (public_token, metadata) => {
      // Handle successful connection
      console.log("public_token", public_token);
      console.log("metadata", metadata);

      // Send public_token to server to exchange for access_token
      ///api/exchange_public_token
      fetch("https://raifinancial.azurewebsites.net/api/get_access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_token }),
      })
        .then(async (res) => await res.json())
        .then((result) => {
          console.log("access_token", result.access_token);
          //console.log("item_id", result.item_id);
          metadata.accounts.forEach(async (x) => {
            var needsRelinkWithOrWithoutID = needsRelink
              ? needsRelink
              : {
                  UserId: "1",
                  ItemId: x.id,
                  BankName: metadata.institution.name,
                  NeedsRelink: null,
                };
            fetch(
              "https://raifinancial.azurewebsites.net/api/updateuserbanktoken",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...needsRelinkWithOrWithoutID,
                  AccessToken: result.access_token,
                }),
              }
            )
              .then(async (res) => await res.json())
              .then((resu) => {
                console.log("Updated access_token for item " + resu.item_id);
                setNeedsRelink(false);
              })
              .catch((e) => console.log(e.message));
          });
        })
        .catch((e) => console.log(e.message));
    },
  };

  const { open: openPlaid, ready: readyPlaid } = usePlaidLink(config);
  const [revenueMonths, setRevenueMonths] = useState([]);
  const [expensesMonths, setExpensesMonths] = useState([]);
  const [revenueByQuarter, setRevenueByQuarter] = useState([]);
  const [revenueAmountsByQuarter, setRevenueAmountsByQuarter] = useState([]);
  const [revenueMonthsByQuarter, setRevenueMonthsByQuarter] = useState([]);
  const [expensesByQuarter, setExpensesByQuarter] = useState([]);
  const [expensesAmountsByQuarter, setExpensesAmountsByQuarter] = useState([]);
  const [expensesMonthsByQuarter, setExpensesMonthsByQuarter] = useState([]);
  const [revenueByYear, setRevenueByYear] = useState([]);
  const [revenueAmountsByYear, setRevenueAmountsByYear] = useState([]);
  const [revenueMonthsByYear, setRevenueMonthsByYear] = useState([]);
  const [expensesByYear, setExpensesByYear] = useState([]);
  const [expensesAmountsByYear, setExpensesAmountsByYear] = useState([]);
  const [expensesMonthsByYear, setExpensesMonthsByYear] = useState([]);

  const showRevenue =
    (selectedFrequency === "Monthly" &&
      revenue &&
      revenue.length > 0 &&
      revenue.find((x) => {
        return (
          x.Color ||
          getEndOfMonth(new Date(new Date(x.Date).getTime() + 86400000 * 5)) ===
            selectedDate
        );
      })) ||
    (selectedFrequency === "Quarterly" &&
      revenueByQuarter &&
      revenueByQuarter.length > 0 &&
      revenueByQuarter.find((x) => {
        return x.Color || x.Quarter === selectedDate;
      })) ||
    (selectedFrequency === "Yearly" &&
      revenueByYear &&
      revenueByYear.length > 0 &&
      revenueByYear.find((x) => {
        return x.Color || x.Year === selectedDate;
      }));
  const showExpenses =
    (selectedFrequency === "Monthly" &&
      expenses &&
      expenses.length > 0 &&
      expenses.find((x) => {
        return (
          x.Color ||
          getEndOfMonth(new Date(new Date(x.Date).getTime() + 86400000 * 5)) ===
            selectedDate
        );
      })) ||
    (selectedFrequency === "Quarterly" &&
      expensesByQuarter &&
      expensesByQuarter.length > 0 &&
      expensesByQuarter.find((x) => {
        return x.Color || x.Quarter === selectedDate;
      })) ||
    (selectedFrequency === "Yearly" &&
      expensesByYear &&
      expensesByYear.length > 0 &&
      expensesByYear.find((x) => {
        return x.Color || x.Year === selectedDate;
      }));
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [hoverMobileView, setHoverMobileView] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const getIOStatement = () => {
    setSelectedFrequency("Monthly");
    setSelectedIO("");
    setSelectedDate(null);
    setRevenue(null);
    setRevenueAmounts([]);
    setExpenses(null);
    setExpensesAmounts([]);
    setRevenueMonths([]);
    setExpensesMonths([]);
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
        fetch("https://raifinancial.azurewebsites.net/api/iostatement", {
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
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setIOStatement([{ Revenue: "please log in again..." }]);
            }
            setIOMonths(
              result.ioStatement
                .sort((a, b) => new Date(b.Month) - new Date(a.Month))
                .map((x, i) => {
                  const date = getEndOfMonth(
                    new Date(new Date(x.Month).getTime() + 86400000 * 6)
                  );
                  if (i === 0) setSelectedDate(date);
                  return date;
                })
            );
            console.log(result.ioStatement);
            result.ioStatement && setIOStatement(result.ioStatement);
            getExpenses();
            getRevenue();
          })
          .catch(() => {
            setIOStatement([{ Revenue: "please log in again..." }]);
          });
      });
  };
  useEffect(() => {
    if (
      authenticatedUser &&
      authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
    )
      getIOStatement();
  }, [authenticatedUser]);
  const [allowUpdate, setAllowUpdate] = useState(true);
  const generalLedgerRef = useRef(null);
  const accountBalancesRef = useRef(null);
  const payrollRef = useRef(null);
  const [generalLedgerHeight, setGeneralLedgerHeight] = useState(0);
  const [accountBalancesHeight, setAccountBalancesHeight] = useState(0);
  const [payrollHeight, setPayrollHeight] = useState(0);
  const revenueRef = useRef(null);
  const expenseRef = useRef(null);
  const [revenueExpensesHeight, setRevenueExpensesHeight] = useState(0);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [chartsHeight, setChartsHeight] = useState(0);
  const invoicesRef = useRef(null);
  const [invoicesHeight, setInvoicesHeight] = useState(0);
  //const [pageHeight, setPageHeight] = useState(0);
  const [expenseFilter, setExpenseFilter] = useState(false);
  const [expenseFilterHover, setExpenseFilterHover] = useState(false);
  useEffect(() => {
    //setPageHeight(document.documentElement.scrollHeight);
    generalLedgerRef.current &&
      setGeneralLedgerHeight(generalLedgerRef.current.offsetHeight);
    accountBalancesRef.current &&
      setAccountBalancesHeight(accountBalancesRef.current.offsetHeight);
    payrollRef.current && setPayrollHeight(payrollRef.current.offsetHeight);
    ioStatement &&
      barChartRef.current &&
      pieChartRef.current &&
      setChartsHeight(
        barChartRef.current.offsetHeight + pieChartRef.current.offsetHeight
      );
    revenueRef.current &&
      expenseRef.current &&
      setRevenueExpensesHeight(
        revenueRef.current.offsetHeight + expenseRef.current.offsetHeight
      );
    invoicesRef.current && setInvoicesHeight(invoicesRef.current.offsetHeight);
  }, [
    generalLedger,
    accountBalances,
    payoutLog,
    ioStatement,
    revenue,
    expenses,
    selectedDate,
    invoices,
    expenseFilter,
  ]);
  const getInvoices = () => {
    if (mobileView) setSelectionMenu(false);
    setSelection("Invoices");
    setInvoices([{ Description: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch("https://raifinancial.azurewebsites.net/api/invoices", {
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
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setInvoices([{ Description: "please log in again..." }]);
            }

            setInvoices(
              result.invoices.sort(
                (a, b) => new Date(b.Date) - new Date(a.Date)
              )
            );
          })
          .catch((e) => {
            console.log(e);
          });
      });
  };
  const [hoverRow, setHoverRow] = useState(null);
  const getAccountBalances = () => {
    if (mobileView) setSelectionMenu(false);
    setSelection("Balances");
    setAccountBalances([{ CurrentBalance: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch("https://raifinancial.azurewebsites.net/api/accountbalances", {
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
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setAccountBalances([
                { CurrentBalance: "please log in again..." },
              ]);
            }
            setAccountBalances(result.accountBalances);
          })
          .catch(() => {
            setAccountBalances([{ CurrentBalance: "please log in again..." }]);
          });
      });
  };
  const getPayoutLog = () => {
    if (mobileView) setSelectionMenu(false);
    setSelection("Payroll");
    setPayoutLog([{ EmployeeName: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch("https://raifinancial.azurewebsites.net/api/payoutlog", {
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
                //forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setPayoutLog([{ EmployeeName: "please log in again..." }]);
            }

            var payoutLog = result.payoutLog.map((x) => {
              const employeeName = x.EmployeeName.split("RTP Sent ")[1];
              return {
                ...x,
                EmployeeName: employeeName
                  ? employeeName.slice(0, employeeName.search(/\d/))
                  : x.EmployeeName,
              };
            });
            var payoutTotals = [];
            var totals = {};
            payoutLog.forEach((x) => {
              if (!totals[x.EmployeeName]) totals[x.EmployeeName] = 0;
              //console.log(x.AmountPaid);
              totals[x.EmployeeName] = totals[x.EmployeeName] + x.AmountPaid;
            });
            setPayoutTotals(totals);
            let triedColors = [];
            let i = 0;
            function getRandomInt(max) {
              const value = Math.floor(Math.random() * max);
              if (triedColors.includes(value)) {
                if (i > 20) return value;
                i++;
                return getRandomInt(max);
              }
              return value;
            }
            setPayoutChart(
              Object.keys(totals).map((employeeName, i) => {
                return {
                  title: employeeName,
                  value: Object.values(totals)[i],
                  //(i / Object.keys(totals).length)
                  color: `rgb(${getRandomInt(250)},${getRandomInt(250)},${
                    getRandomInt(250) //(i / result.payoutLog.length) * 250
                  })`,
                };
              })
            );
            setPayoutLog(
              payoutLog.sort(
                (a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate)
              )
            );
          })
          .catch((e) => {
            console.log(e);
          });
      });
  };
  return (
    <div
      style={{
        display: mobileView ? "block" : "flex",
      }}
    >
      <div
        ref={selectionMenuRef}
        //onMouseEnter={() => setClickDiv("")}
        style={{
          zIndex: "1",
          //display: mobileView ? "flex" : "block",
          position: "fixed",
          overflowX: "hidden",
          overflowY: "auto",
          fontWeight: "bolder",
          color: "white",
          background: `linear-gradient(to bottom, darkorange, orange 70.71%)`,
          borderBottom: mobileView ? "5px solid rgba(0,0,0,.3)" : "",
          borderRight: !mobileView ? "5px solid rgba(0,0,0,.3)" : "",
          width: mobileView ? "100vw" : "300px",
          height: selectionMenu ? "100vh" : "min-content", // mobileView ? "min-content" : "100vh",
          transition: ".3s ease-in",
        }}
      >
        <div>
          <div
            style={{
              top: "46px",
              position: "absolute",
              borderBottom:
                mobileView && !selectionMenu
                  ? ""
                  : `2px solid ${!mobileView ? "papayawhip" : "orange"}`,
              width: "100%",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              cursor: "pointer",
              padding: "5px",
            }}
          >
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
            <div
              onClick={() => {
                setSelectionMenu(!selectionMenu);
                if (!(windowWidth < 500)) setMobileView(!mobileView);
              }}
              style={{
                padding: "0px 10px",
                paddingTop: "5px",
                fontSize: windowWidth < 500 ? "" : "20px",
              }}
            >
              {scrollPosition > 0 && mobileView && !selectionMenu
                ? selection
                : "RAI Finance"}
            </div>
            {!(windowWidth < 500) && (
              <div
                onMouseEnter={() => {
                  setHoverMobileView(true);
                }}
                onMouseLeave={() => {
                  setHoverMobileView(false);
                }}
                onClick={() => {
                  setSelectionMenu(!selectionMenu);
                  setMobileView(!mobileView);
                }}
                style={{
                  transform: `rotate(${mobileView ? 225 : 45}deg)`,
                  transition: ".3s ease-out",
                  right: "0px",
                  position: mobileView ? "relative" : "absolute",
                  margin: "6px 0px",
                  borderLeft: hoverMobileView
                    ? "4px solid white"
                    : "4px solid antiquewhite",
                  borderBottom: hoverMobileView
                    ? "4px solid white"
                    : "4px solid antiquewhite",
                  height: "20px",
                  width: "20px",
                  borderRadius: "5px",
                  backgroundColor: "transparent",
                }}
              ></div>
            )}
          </div>
          <div
            style={{
              display: selectionMenu ? "block" : "none",
              textAlign: "center",
              margin: "20px",
              marginBottom: "20px",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "rgba(250,250,250,0.15)",
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
                      backgroundColor: "darkorange",
                    }}
                  ></div>
                  <div
                    style={{
                      width: "20px",
                      height: "12px",
                      borderTopLeftRadius: "8px",
                      borderTopRightRadius: "8px",
                      backgroundColor: "darkorange",
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
                <button
                  onClick={() =>
                    instance.loginPopup({ prompt: "select_account" })
                  }
                >
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
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft: selection === "I/S" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "I/S"
                        ? "rgba(250,250,250,.15)"
                        : selection === "I/S"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration: selector === "I/S" ? "underline" : "none",
                    listStyleType: selector === "I/S" ? "initial" : "none",
                  }}
                  onClick={getIOStatement}
                >
                  <div class="fas fa-home w-6"></div>&nbsp;&nbsp;I/S
                </div>
                <div
                  onMouseEnter={(e) => setSelector("General Ledger")}
                  style={{
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft:
                      selection === "General Ledger" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "General Ledger"
                        ? "rgba(250,250,250,.15)"
                        : selection === "General Ledger"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration:selector === "General Ledger" ? "underline" : "none",
                    listStyleType:
                      selector === "General Ledger" ? "initial" : "none",
                  }}
                  onClick={() => {
                    getGeneralLedger();
                    setSelection("General Ledger");
                  }}
                >
                  <div class="fas fa-book w-6"></div>&nbsp;&nbsp;General Ledger
                </div>
                <div
                  onMouseEnter={(e) => setSelector("Charts")}
                  style={{
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft: selection === "Charts" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "Charts"
                        ? "rgba(250,250,250,.15)"
                        : selection === "Charts"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration: selector === "Charts" ? "underline" : "none",
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
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft:
                      selection === "Balances" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "Balances"
                        ? "rgba(250,250,250,.15)"
                        : selection === "Balances"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration:selector === "Balances" ? "underline" : "none",
                    listStyleType: selector === "Balances" ? "initial" : "none",
                  }}
                  onClick={getAccountBalances}
                >
                  <div class="fas fa-wallet w-6"></div>&nbsp;&nbsp;Balances
                </div>
                <div
                  onMouseEnter={(e) => setSelector("Payroll")}
                  style={{
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft:
                      selection === "Payroll" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "Payroll"
                        ? "rgba(250,250,250,.15)"
                        : selection === "Payroll"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration: selector === "Payroll" ? "underline" : "none",
                    listStyleType: selector === "Payroll" ? "initial" : "none",
                  }}
                  onClick={getPayoutLog}
                >
                  <div class="fas fa-exchange-alt w-6"></div>&nbsp;&nbsp;Payroll
                </div>
                <div
                  onMouseEnter={(e) => setSelector("Invoices")}
                  style={{
                    padding: "6px 10px",
                    margin: "0px 10px",
                    borderRadius: "3px",
                    borderLeft:
                      selection === "Invoices" ? "2px solid white" : "",
                    transition: ".3s ease-out",
                    backgroundColor:
                      selector === "Invoices"
                        ? "rgba(250,250,250,.15)"
                        : selection === "Invoices"
                        ? "rgba(250,250,250,.3)"
                        : "",
                    //textDecoration:selector === "Invoices" ? "underline" : "none",
                    listStyleType: selector === "Invoices" ? "initial" : "none",
                  }}
                  onClick={getInvoices}
                >
                  <div class="fas fa-file-alt w-6"></div>&nbsp;&nbsp;Invoices
                </div>

                <div
                  style={{
                    padding: "1em",
                    marginBottom: "1em",
                  }}
                >
                  {showBankAccounts ? (
                    bankAccounts.length > 0 ? (
                      <div style={{ display: "block" }}>
                        <div
                          onClick={() => {
                            setShowBankAccounts(false);
                            setBankAccounts([]);
                            setNeedsRelink(false);
                          }}
                          style={{
                            width: "min-content",
                            margin: "10px",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "2px solid",
                          }}
                        >
                          &times;
                        </div>
                        {bankAccounts.map((x) => {
                          return (
                            <div>
                              {x.NeedsRelink && (
                                <button
                                  disabled={!readyPlaid || !linkTokenPlaid}
                                  onClick={() => {
                                    setNeedsRelink(x);
                                    openPlaid();
                                  }}
                                >
                                  <span role="img" aria-label="hazard-sign">
                                    ⚠️
                                  </span>
                                  {space}Reconnect
                                </button>
                              )}
                              {space}
                              {x.BankName}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      "No bank account is connected yet."
                    )
                  ) : (
                    authenticatedUser && (
                      <button
                        onClick={() => {
                          setShowBankAccounts(true);
                          ///api/needs_relink?userId=1
                          instance
                            .acquireTokenSilent({
                              ...loginRequest,
                              account: accounts[0],
                            })
                            .then((response) => {
                              fetch(
                                "https://raifinancial.azurewebsites.net/api/userbanktokens",
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
                                  if (result.code === 401) {
                                    return await instance.acquireTokenRedirect({
                                      account: accounts[0],
                                      //forceRefresh: true,
                                      refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                                    });
                                  }
                                  if (result.userBankTokens.length > 0) {
                                    setBankAccounts(result.userBankTokens);
                                  }
                                })
                                .catch((e) => console.log(e.message));
                              ///api/create_link_token
                              fetch(
                                "https://raifinancial.azurewebsites.net/api/get_link_token",
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: "Bearer " + response.idToken,
                                    "Content-Type": "application/JSON",
                                  },
                                  body: JSON.stringify({
                                    referer: window.location.href,
                                  }),
                                }
                              )
                                .then(async (res) => await res.json())
                                .then(async (result) => {
                                  if (result.code === 401) {
                                    return await instance.acquireTokenRedirect({
                                      account: accounts[0],
                                      //forceRefresh: true,
                                      refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
                                    });
                                  }
                                  setLinkToken(result.link_token);
                                })
                                .catch((e) => console.log(e.message));
                            });
                        }}
                      >
                        Bank Accounts
                      </button>
                    )
                  )}
                  {readyPlaid && linkTokenPlaid ? (
                    <button
                      onClick={() => {
                        setNeedsRelink(false);
                        openPlaid();
                      }}
                      disabled={!readyPlaid || !linkTokenPlaid}
                    >
                      Connect New Bank Account
                    </button>
                  ) : (
                    showBankAccounts && "Connecting to plaid..."
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        //onMouseEnter={() => setClickDiv("")}
        style={{
          //display: mobileView ? "float" : "block",
          position: "relative",
          fontWeight: "bolder",
          color: "white",
          background: `linear-gradient(to bottom, darkorange, orange 70.71%)`,
          borderBottom: mobileView ? "5px solid rgba(0,0,0,.3)" : "",
          borderRight: !mobileView ? "5px solid rgba(0,0,0,.3)" : "",
          width: mobileView ? "100vw" : "300px",
          height: mobileView ? "min-content" : "100vh",
          transition: ".3s ease-in",
        }}
      ></div>
      <div
        style={{
          marginTop: mobileView ? "46px" : "0px",
          backgroundColor: "snow",
          display: "block",
        }}
      >
        <div
          style={{
            fontWeight: mobileView ? "" : "bolder",
            textIndent: "20px",
            padding: "20px 0px",
            width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
            color: "black",
            backgroundColor: "white",
          }}
        >
          <div
            onClick={() => setLoginMenu(true)}
            style={{
              cursor: "pointer",
              transform: "translateY(-25%)",
              display: "flex",
              height: "40px",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "darkorange",
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
                        backgroundColor: "darkorange",
                      }}
                    ></div>
                    <div
                      style={{
                        width: "20px",
                        height: "12px",
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "8px",
                        backgroundColor: "darkorange",
                      }}
                    ></div>
                  </div>
                  <p>{accounts[0].username}</p>
                </div>
                <button
                  onClick={() =>
                    instance.logoutRedirect({
                      account: accounts[0],
                      mainWindowRedirectUri: window.location.href,
                    })
                  }
                >
                  Log out
                </button>
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
                          key={user.id}
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
              <button
                onClick={() =>
                  instance.loginPopup({ prompt: "select_account" })
                }
              >
                Log in
              </button>
            )}
          </div>
          Financial Dashboard
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
            width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
            backgroundColor: "whitesmoke",
          }}
        >
          {selection === "I/S" && (
            <div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <select
                  value={selectedDate ? selectedDate : ""}
                  style={{
                    margin: "10px",
                  }}
                  onChange={(e) => {
                    //setSelectedIO("");
                    setSelectedDate(e.target.value);
                  }}
                >
                  {ioMonths.map((month) => {
                    const zeroPad = (x) => {
                      return x < 10 ? "0" + x : x;
                    };
                    return (
                      <option value={month} key={month}>
                        {selectedFrequency === "Monthly"
                          ? month === getEndOfMonth(new Date())
                            ? "Current Month"
                            : month
                          : selectedFrequency === "Quarterly"
                          ? month ===
                            new Date().getFullYear() +
                              {
                                "01": "-Q1",
                                "02": "-Q1",
                                "03": "-Q1",
                                "04": "-Q2",
                                "05": "-Q2",
                                "06": "-Q2",
                                "07": "-Q3",
                                "08": "-Q3",
                                "09": "-Q3",
                                10: "-Q4",
                                11: "-Q4",
                                12: "-Q4",
                              }[
                                String(new Date().getMonth() + 1).padStart(
                                  2,
                                  "0"
                                )
                              ]
                            ? "Current Quarter"
                            : month
                          : selectedFrequency === "Yearly"
                          ? month === new Date().getFullYear()
                            ? "Current Year"
                            : month
                          : month}
                      </option>
                    );
                  })}
                </select>
                <span
                  class="fa fa-refresh"
                  style={{
                    cursor: "pointer",
                    height: "min-content",
                    padding: "6px",
                    borderRadius: "10px",
                  }}
                  onClick={() => {
                    getIOStatement();
                    setSelection("I/S");
                  }}
                ></span>
              </div>
              <div
                style={{
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                  //overflowX: windowWidth < 500 ? "" : "auto",
                  //overflowY: "hidden",
                  //height: windowWidth < 500 ? "" : "170px",
                }}
              >
                {ioStatement === null ? (
                  ""
                ) : ioStatement.length === 0 ? (
                  "No results"
                ) : (
                  <div
                    style={{
                      flexWrap: "wrap",
                      display: windowWidth < 500 ? "block" : "flex",
                    }}
                  >
                    <div
                      onClick={getRevenue}
                      onMouseEnter={() => setIOHover("Revenue")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid darkorange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        marginLeft: "20px",
                        marginBottom: "20px",
                        textAlign: "left",
                        width:
                          !mobileView && windowWidth - 300 < 500
                            ? "calc(100vw - 360px)"
                            : windowWidth < 500
                            ? "calc(100% - 60px)"
                            : "200px",
                        padding: "10px",
                        paddingBottom: "20px",
                        transform: `translateY(${
                          ioHover === "Revenue" ? "-10px" : "0px"
                        })`,
                        boxShadow:
                          ioHover === "Revenue"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".2s ease-out",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        Revenue
                        <div
                          class="fas fa-chart-line"
                          style={{
                            margin: "4px",
                            color: "darkorange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder", fontSize: "30px" }}>
                        $
                        {thisMonthsIOStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.Revenue.toFixed(0)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: !(windowWidth < 500) ? "150px" : "",
                          color:
                            changeInTotalRevenue === 0
                              ? "grey"
                              : changeInTotalRevenue > 0
                              ? "mediumseagreen"
                              : "crimson",
                        }}
                      >
                        {Number(changeInTotalRevenue) >= 0 ? (
                          <span class="fa fa-arrow-trend-up"></span>
                        ) : (
                          <span class="fa fa-arrow-trend-down"></span>
                        )}
                        {space}
                        {changeInTotalRevenue === 0
                          ? "-"
                          : changeInTotalRevenue}
                        % vs last{space}
                        {selectedFrequency
                          .toLocaleLowerCase()
                          .substring(0, selectedFrequency.length - 2)}
                      </div>
                    </div>
                    <div
                      onClick={getExpenses}
                      onMouseEnter={() => setIOHover("Expenses")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid darkorange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        marginLeft: "20px",
                        marginBottom: "20px",
                        textAlign: "left",
                        width:
                          !mobileView && windowWidth - 300 < 500
                            ? "calc(100vw - 360px)"
                            : windowWidth < 500
                            ? "calc(100% - 60px)"
                            : "200px",
                        padding: "10px",
                        paddingBottom: "20px",
                        transform: `translateY(${
                          ioHover === "Expenses" ? "-10px" : "0px"
                        })`,
                        boxShadow:
                          ioHover === "Expenses"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".2s ease-out",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        Expenses
                        <div
                          class="fas fa-file-invoice-dollar"
                          style={{
                            margin: "4px",
                            color: "darkorange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder", fontSize: "30px" }}>
                        $
                        {thisMonthsIOStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.Expenses.toFixed(0)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: !(windowWidth < 500) ? "150px" : "",
                          color:
                            changeInTotalExpenses === 0
                              ? "grey"
                              : changeInTotalExpenses > 0
                              ? "crimson"
                              : "mediumseagreen",
                        }}
                      >
                        {Number(changeInTotalExpenses) >= 0 ? (
                          <span class="fa fa-arrow-trend-up"></span>
                        ) : (
                          <span class="fa fa-arrow-trend-down"></span>
                        )}
                        {space}
                        {changeInTotalExpenses === 0
                          ? "-"
                          : changeInTotalExpenses}
                        % vs last{space}
                        {selectedFrequency
                          .toLocaleLowerCase()
                          .substring(0, selectedFrequency.length - 2)}
                      </div>
                    </div>
                    <div
                      onMouseEnter={() => setIOHover("Profit")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid darkorange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        marginLeft: "20px",
                        marginBottom: "20px",
                        textAlign: "left",
                        width:
                          !mobileView && windowWidth - 300 < 500
                            ? "calc(100vw - 360px)"
                            : windowWidth < 500
                            ? "calc(100% - 60px)"
                            : "200px",
                        padding: "10px",
                        paddingBottom: "20px",
                        transform: `translateY(${
                          ioHover === "Profit" ? "-10px" : "0px"
                        })`,
                        boxShadow:
                          ioHover === "Profit"
                            ? "5px 5px 5px 1px rgb(0,0,0,.2)"
                            : "",
                        transition: ".2s ease-out",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        Profit
                        <div
                          class="fas fa-wallet"
                          style={{
                            margin: "4px",
                            color: "darkorange",
                            padding: "10px",
                            borderRadius: "8px",
                            backgroundColor: "peachpuff",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontWeight: "bolder", fontSize: "30px" }}>
                        $
                        {thisMonthsIOStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.NetProfit.toFixed(0)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: !(windowWidth < 500) ? "150px" : "",
                          color:
                            thisMonthsIOStatement.NetProfit === 0
                              ? "grey"
                              : thisMonthsIOStatement.NetProfit > 0
                              ? "mediumseagreen"
                              : "crimson",
                        }}
                      >
                        {Number(changeInNetProfit) >= 0 ? (
                          <span class="fa fa-arrow-trend-up"></span>
                        ) : (
                          <span class="fa fa-arrow-trend-down"></span>
                        )}
                        {space}
                        {changeInNetProfit === 0 ? "-" : changeInNetProfit}% vs
                        last{space}
                        {selectedFrequency
                          .toLocaleLowerCase()
                          .substring(0, selectedFrequency.length - 2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div
                style={{
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                  height: chartsHeight + 40,
                  overflowX:
                    windowWidth - (mobileView ? 0 : 360) < 500 ? "auto" : "",
                  overflowY:
                    windowWidth - (mobileView ? 0 : 360) < 500 ? "hidden" : "",
                  //justifyContent: "space-evenly",
                  display:
                    windowWidth - (mobileView ? 0 : 360) < 500 //|| (windowWidth < 900 && !mobileView)
                      ? "block"
                      : "flex",
                }}
              >
                <div
                  ref={barChartRef}
                  onMouseLeave={() => setIOHover("")}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    width:
                      windowWidth - (mobileView ? 0 : 360) < 500
                        ? windowWidth - (mobileView ? 0 : 360) < 300
                          ? "200px"
                          : windowWidth - (mobileView ? 60 : 360)
                        : (windowWidth - (mobileView ? 120 : 420)) / 2,
                    padding: "10px",
                  }}
                >
                  <div style={{ paddingBottom: "20px", fontWeight: "bolder" }}>
                    <select
                      value={selectedFrequency}
                      style={{ position: "absolute", right: "10px" }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedFrequency(value);
                        if (value === "Monthly") {
                          setIOMonths(
                            ioStatement
                              .sort(
                                (a, b) => new Date(b.Month) - new Date(a.Month)
                              )
                              .map((x, i) => {
                                const date = getEndOfMonth(
                                  new Date(
                                    new Date(x.Month).getTime() + 86400000 * 6
                                  )
                                );
                                if (i === 0) setSelectedDate(date);
                                return date;
                              })
                          );
                        } else if (value === "Quarterly") {
                          var ioMonths = [];

                          ioStatement
                            .sort(
                              (a, b) => new Date(b.Month) - new Date(a.Month)
                            )
                            .forEach((x, i) => {
                              const month = String(
                                new Date(
                                  new Date(x.Month).getTime() + 86400000 * 6
                                ).getMonth() + 1
                              ).padStart(2, "0");
                              const year = new Date(x.Month).getFullYear();
                              const thisQuarter = ["01", "02", "03"].includes(
                                month
                              )
                                ? year + "-Q1"
                                : ["04", "05", "06"].includes(month)
                                ? year + "-Q2"
                                : ["07", "08", "09"].includes(month)
                                ? year + "-Q3"
                                : ["10", "11", "12"].includes(month)
                                ? year + "-Q4"
                                : "";
                              const found = ioMonths.find(
                                (y) => y === thisQuarter
                              );
                              if (!found) ioMonths.push(thisQuarter);
                            });
                          setSelectedDate(ioMonths[0]);
                          setIOMonths(ioMonths);
                        } else if (value === "Yearly") {
                          var ioMonths = [];

                          ioStatement
                            .sort(
                              (a, b) => new Date(b.Month) - new Date(a.Month)
                            )
                            .forEach((x, i) => {
                              const year = new Date(x.Month).getFullYear();

                              const found = ioMonths.find((y) => y === year);
                              if (!found) ioMonths.push(year);
                            });
                          setSelectedDate(ioMonths[0]);
                          setIOMonths(ioMonths);
                        }
                      }}
                    >
                      {["Monthly", "Quarterly", "Yearly"].map((x) => {
                        return <option key={x}>{x}</option>;
                      })}
                    </select>
                    Revenue vs Expenses
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            margin: "0px 10px",
                            width: "40px",
                            height: "20px",
                            backgroundColor: "sandybrown",
                          }}
                        ></div>
                        Revenue
                      </div>
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            margin: "0px 10px",
                            width: "40px",
                            height: "20px",
                            backgroundColor: "salmon",
                          }}
                        ></div>
                        Expenses
                      </div>
                    </div>
                    {ioStatement && (
                      <Bar
                        options={{
                          onClick: (event, elements) => {
                            if (elements.length > 0) {
                              const elementIndex = elements[0].index;
                              const datasetIndex = elements[0].datasetIndex;
                              const value =
                                barChartData.datasets[datasetIndex].data[
                                  elementIndex
                                ];
                              const label =
                                barChartData.datasets[datasetIndex].label;
                              //const label = barChartData.labels[elementIndex];
                              console.log(label);
                              setSelectedIO(label);
                              if (label === "Revenue") {
                                getRevenue();
                              } else if (label === "Expenses") {
                                getExpenses();
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                        data={barChartData}
                      />
                    )}
                  </div>
                </div>
                <div
                  ref={pieChartRef}
                  onMouseLeave={() => setIOHover("")}
                  style={{
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    width:
                      windowWidth - (mobileView ? 0 : 360) < 500
                        ? windowWidth - (mobileView ? 0 : 360) < 300
                          ? "200px"
                          : windowWidth - (mobileView ? 60 : 360)
                        : (windowWidth - (mobileView ? 120 : 420)) / 2,
                    padding: "10px",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bolder",
                    }}
                  >
                    {selectedIO.substring(0, 1).toLocaleUpperCase() +
                      selectedIO.substring(1, selectedIO.length)}
                  </div>
                  <div
                    style={{
                      display: windowWidth < 300 ? "block" : "flex",
                      justifyContent: "space-evenly",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        //height:windowWidth < 500 ? (windowWidth - 60) / 2 : "200px",
                        width:
                          windowWidth < 500 ? (windowWidth - 60) / 2 : "200px",
                        marginRight: "30px",
                      }}
                    >
                      {selectedIO === "revenue" ? (
                        showRevenue /*&&
                        revenue.find(
                          (x) =>
                            x.Color ||
                            getEndOfMonth(
                              new Date(
                                new Date(x.Date).getTime() + 86400000 * 5
                              )
                            ) === selectedDate
                        )*/ ? (
                          <PieChart
                            data={(selectedFrequency === "Monthly"
                              ? revenue.filter((x) => {
                                  if (
                                    !x.Color &&
                                    getEndOfMonth(
                                      new Date(
                                        new Date(x.Date).getTime() +
                                          86400000 * 5
                                      )
                                    ) !== selectedDate
                                  )
                                    return null;
                                  return x;
                                })
                              : selectedFrequency === "Quarterly"
                              ? revenueByQuarter.filter((x) => {
                                  if (!x.Color && x.Quarter !== selectedDate)
                                    return null;
                                  return x;
                                })
                              : selectedFrequency === "Yearly"
                              ? revenueByYear.filter((x) => {
                                  if (!x.Color && x.Year !== selectedDate)
                                    return null;
                                  return x;
                                })
                              : []
                            ).map((x, i) => {
                              return {
                                title: x.Category,
                                value: x.Amount,
                                color: x.Color ? x.Color : pieChartColors[i],
                              };
                            })}
                            //radius={100}
                            lineWidth={80}
                          />
                        ) : (
                          "There is no revenue breakdown available for this time period."
                        )
                      ) : selectedIO === "expenses" ? (
                        showExpenses /*&&
                        expenses.find(
                          (x) =>
                            x.Color ||
                            getEndOfMonth(
                              new Date(
                                new Date(x.Date).getTime() + 86400000 * 5
                              )
                            ) === selectedDate
                        )*/ ? (
                          <PieChart
                            data={(selectedFrequency === "Monthly"
                              ? expenses.filter((x) => {
                                  if (
                                    !x.Color &&
                                    getEndOfMonth(
                                      new Date(
                                        new Date(x.Date).getTime() +
                                          86400000 * 5
                                      )
                                    ) !== selectedDate
                                  )
                                    return null;
                                  return x;
                                })
                              : selectedFrequency === "Quarterly"
                              ? expensesByQuarter.filter((x) => {
                                  if (!x.Color && x.Quarter !== selectedDate)
                                    return null;
                                  return x;
                                })
                              : selectedFrequency === "Yearly"
                              ? expensesByYear.filter((x) => {
                                  if (!x.Color && x.Year !== selectedDate)
                                    return null;
                                  return x;
                                })
                              : []
                            )
                              .map((x, i) => {
                                return {
                                  title: x.Category,
                                  value: x.Amount,
                                  color: x.Color ? x.Color : pieChartColors[i],
                                };
                              })
                              .filter((x) => x)}
                            //radius={100}
                            lineWidth={80}
                          />
                        ) : (
                          "There is no expense breakdown available for this time period."
                        )
                      ) : (
                        "Click revenue or expenses"
                      )}
                    </div>
                    <div style={{ display: "block", fontSize: "12px" }}>
                      {selectedIO === "revenue"
                        ? (selectedFrequency === "Monthly"
                            ? !revenue
                              ? []
                              : revenue.filter((x) => {
                                  if (
                                    getEndOfMonth(
                                      new Date(
                                        new Date(x.Date).getTime() +
                                          86400000 * 5
                                      )
                                    ) !== selectedDate
                                  )
                                    return null;
                                  return x;
                                })
                            : selectedFrequency === "Quarterly"
                            ? !revenueByQuarter
                              ? []
                              : revenueByQuarter.filter((x) => {
                                  if (x.Quarter !== selectedDate) return null;
                                  return x;
                                })
                            : selectedFrequency === "Yearly"
                            ? !revenueByYear
                              ? []
                              : revenueByYear.filter((x) => {
                                  if (x.Year !== selectedDate) return null;
                                  return x;
                                })
                            : []
                          ).map((x, i) => {
                            return (
                              <div key={i} style={{ display: "flex" }}>
                                <div
                                  style={{
                                    margin: "6px",
                                    width: "30px",
                                    height: "10px",
                                    backgroundColor: pieChartColors[i],
                                  }}
                                ></div>
                                <div>{x.Category}</div>
                              </div>
                            );
                          })
                        : selectedIO === "expenses"
                        ? (selectedFrequency === "Monthly"
                            ? expenses &&
                              expenses.filter((x) => {
                                if (
                                  getEndOfMonth(
                                    new Date(
                                      new Date(x.Date).getTime() + 86400000 * 5
                                    )
                                  ) !== selectedDate
                                )
                                  return null;
                                return x;
                              })
                            : selectedFrequency === "Quarterly"
                            ? expensesByQuarter &&
                              expensesByQuarter.filter((x) => {
                                if (x.Quarter !== selectedDate) return null;
                                return x;
                              })
                            : selectedFrequency === "Yearly"
                            ? expensesByYear &&
                              expensesByYear.filter((x) => {
                                if (x.Year !== selectedDate) return null;
                                return x;
                              })
                            : []
                          ).map((x, i) => {
                            return (
                              <div key={i} style={{ display: "flex" }}>
                                <div
                                  style={{
                                    margin: "6px",
                                    width: "30px",
                                    height: "10px",
                                    backgroundColor: pieChartColors[i],
                                  }}
                                ></div>
                                <div>{x.Category}</div>
                              </div>
                            );
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
              {true ? null : selectedIO === "revenue" ? (
                <div>
                  {(selectedFrequency === "Monthly"
                    ? revenue !== null && revenue
                    : selectedFrequency === "Quarterly"
                    ? revenueByQuarter !== null && revenueByQuarter
                    : selectedFrequency === "Yearly"
                    ? revenueByYear !== null && revenueByYear
                    : []
                  ).map((x, i) => {
                    var total = 0;
                    (selectedFrequency === "Monthly"
                      ? revenueAmounts
                      : selectedFrequency === "Quarterly"
                      ? revenueAmountsByQuarter
                      : selectedFrequency === "Yearly"
                      ? revenueAmountsByYear
                      : []
                    ).forEach((amount) => {
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
                  {(selectedFrequency === "Monthly"
                    ? expenses !== null && expenses
                    : selectedFrequency === "Quarterly"
                    ? expensesByQuarter !== null && expensesByQuarter
                    : selectedFrequency === "Yearly"
                    ? expensesByYear !== null && expensesByYear
                    : []
                  ).map((x, i) => {
                    var total = 0;
                    (selectedFrequency === "Monthly"
                      ? expensesAmounts
                      : selectedFrequency === "Quarterly"
                      ? expensesAmountsByQuarter
                      : selectedFrequency === "Yearly"
                      ? expensesAmountsByYear
                      : []
                    ).forEach((amount) => {
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
              {((selectedIO === "revenue" && showRevenue) ||
                (selectedIO === "expenses" && showExpenses)) && (
                <select
                  value={selectedDate ? selectedDate : ""}
                  style={{
                    margin: "10px",
                  }}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {(selectedIO === "revenue"
                    ? selectedFrequency === "Monthly"
                      ? revenueMonths
                      : selectedFrequency === "Quarterly"
                      ? revenueMonthsByQuarter
                      : selectedFrequency === "Yearly"
                      ? revenueMonthsByYear
                      : []
                    : selectedIO === "expenses"
                    ? selectedFrequency === "Monthly"
                      ? expensesMonths
                      : selectedFrequency === "Quarterly"
                      ? expensesMonthsByQuarter
                      : selectedFrequency === "Yearly"
                      ? expensesMonthsByYear
                      : []
                    : []
                  ).map((date) => {
                    const zeroPad = (x) => {
                      return x < 10 ? "0" + x : x;
                    };
                    //console.log(date, getEndOfMonth(new Date()));
                    return (
                      <option value={date} key={date}>
                        {selectedFrequency === "Monthly"
                          ? date === getEndOfMonth(new Date())
                            ? "Current Month"
                            : date
                          : selectedFrequency === "Quarterly"
                          ? date ===
                            new Date().getFullYear() +
                              {
                                "01": "-Q1",
                                "02": "-Q1",
                                "03": "-Q1",
                                "04": "-Q2",
                                "05": "-Q2",
                                "06": "-Q2",
                                "07": "-Q3",
                                "08": "-Q3",
                                "09": "-Q3",
                                10: "-Q4",
                                11: "-Q4",
                                12: "-Q4",
                              }[
                                String(new Date().getMonth() + 1).padStart(
                                  2,
                                  "0"
                                )
                              ]
                            ? "Current Quarter"
                            : date
                          : selectedFrequency === "Yearly"
                          ? date === new Date().getFullYear()
                            ? "Current Year"
                            : date
                          : date}
                      </option>
                    );
                  })}
                </select>
              )}
              <div
                style={{
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                  height:
                    windowWidth - (mobileView ? 0 : 360) < 500
                      ? revenueExpensesHeight + 80
                      : "",
                  overflowX: "auto",
                  overflowY: "hidden",
                  display:
                    windowWidth - (mobileView ? 0 : 360) < 500 //|| (windowWidth < 900 && !mobileView)
                      ? "block"
                      : "flex",
                  alignItems: "flex-start",
                }}
              >
                <table
                  ref={revenueRef}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    padding: "10px",
                  }}
                >
                  <caption
                    style={{
                      display: "flex",
                      width: "max-content",
                      position: "relative",
                      fontSize: "20px",
                      fontWeight: "bolder",
                      paddingBottom: "14px",
                      colspan: "2",
                    }}
                  >
                    Revenue
                  </caption>
                  <tbody>
                    {ioStatement !== null && ioStatement.length > 0 && (
                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>CATEGORY</div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>AMOUNT</div>
                        </td>
                      </tr>
                    )}

                    {(!showRevenue
                      ? []
                      : selectedFrequency === "Monthly"
                      ? revenue !== null && revenue.length > 0
                        ? revenue
                        : []
                      : selectedFrequency === "Quarterly"
                      ? revenueByQuarter !== null && revenueByQuarter.length > 0
                        ? revenueByQuarter
                        : []
                      : selectedFrequency === "Yearly"
                      ? revenueByYear !== null && revenueByYear.length > 0
                        ? revenueByYear
                        : []
                      : []
                    ).map((x, i) => {
                      const doesntMatch =
                        selectedFrequency === "Monthly"
                          ? getEndOfMonth(
                              new Date(
                                new Date(x.Date).getTime() + 86400000 * 5
                              )
                            ) !== selectedDate
                          : selectedFrequency === "Quarterly"
                          ? x.Quarter !== selectedDate
                          : selectedFrequency === "Yearly"
                          ? x.Year !== selectedDate
                          : true;
                      if (selectedDate === null || doesntMatch) return null;
                      return (
                        <tr
                          onMouseEnter={() => {
                            setHoverRow(x.Category);
                          }}
                          onMouseLeave={() => {
                            setHoverRow(null);
                          }}
                          key={i + x.Date}
                          style={{
                            backgroundColor:
                              x.Category === hoverRow
                                ? "rgb(240,240,240,.3)"
                                : "",
                          }}
                        >
                          <td>
                            <div>{x.Category}</div>
                          </td>
                          <td>
                            <div>${addCommas(String(x.Amount.toFixed(2)))}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <table
                  ref={expenseRef}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    padding: "10px",
                  }}
                >
                  <caption
                    style={{
                      display: "flex",
                      width: "max-content",
                      position: "relative",
                      fontSize: "20px",
                      fontWeight: "bolder",
                      paddingBottom: "14px",
                      colspan: "2",
                    }}
                  >
                    Expenses
                    {/*selectedIO.substring(0, 1).toLocaleUpperCase() +
                        selectedIO.substring(1, selectedIO.length)*/}
                  </caption>
                  <tbody>
                    {ioStatement !== null && ioStatement.length > 0 && (
                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>CATEGORY</div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>AMOUNT</div>
                        </td>
                      </tr>
                    )}
                    {(!showExpenses
                      ? []
                      : selectedFrequency === "Monthly"
                      ? expenses !== null && expenses.length > 0
                        ? expenses
                        : []
                      : selectedFrequency === "Quarterly"
                      ? expensesByQuarter !== null &&
                        expensesByQuarter.length > 0
                        ? expensesByQuarter
                        : []
                      : selectedFrequency === "Yearly"
                      ? expensesByYear !== null && expensesByYear.length > 0
                        ? expensesByYear
                        : []
                      : []
                    ).map((x, i) => {
                      const doesntMatch =
                        selectedFrequency === "Monthly"
                          ? getEndOfMonth(
                              new Date(
                                new Date(x.Date).getTime() + 86400000 * 5
                              )
                            ) !== selectedDate
                          : selectedFrequency === "Quarterly"
                          ? x.Quarter !== selectedDate
                          : selectedFrequency === "Yearly"
                          ? x.Year !== selectedDate
                          : true;
                      if (selectedDate === null || doesntMatch) return null;
                      return (
                        <tr
                          onMouseEnter={() => {
                            setHoverRow(x.Category);
                          }}
                          onMouseLeave={() => {
                            setHoverRow(null);
                          }}
                          key={i + x.Date}
                          style={{
                            backgroundColor:
                              x.Category === hoverRow
                                ? "rgb(240,240,240,.3)"
                                : "",
                          }}
                        >
                          <td>
                            <div
                              onClick={() => {
                                setExpenseFilter(x.Category);
                                setSelection("General Ledger");
                                getGeneralLedger();
                              }}
                            >
                              <span
                                style={{
                                  width:
                                    hoverRow === x.Category
                                      ? "min-content"
                                      : "0px",
                                  transition:
                                    hoverRow === x.Category
                                      ? ".3s ease-in"
                                      : ".05s ease-out",
                                  transform: `translateX(${
                                    hoverRow === x.Category ? "-50%" : "-100%"
                                  })`,
                                  opacity: hoverRow === x.Category ? 1 : 0,
                                }}
                                class="fa-solid fa-arrow-right"
                              ></span>
                              {x.Category}
                            </div>
                          </td>
                          <td>
                            <div>${addCommas(String(x.Amount.toFixed(2)))}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selection === "General Ledger" && (
            <div
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                width: mobileView ? "100%" : windowWidth - 300,
              }}
            >
              <div
                onMouseEnter={() => {
                  setHoverDivs(true);
                }}
                onMouseLeave={() => {
                  setHoverDivs(false);
                }}
                style={{
                  width: "min-content",
                  display: generalLedger.length > 0 ? "none" : "none",
                  margin: "10px",
                  border:
                    "2px solid " + (hoverDivs === true ? "black" : "lightgrey"),
                  borderRadius: "10px",
                  transition: ".3s ease-in",
                }}
              >
                <div
                  style={{
                    justifyContent: "flex-end",
                    transform: "scaleX(-1)",
                    //width: `calc(${mobileView ? "100vw" : "100vw - 300px"})`,
                    display: selection !== "I/S" ? "flex" : "none",
                    height: "28px",
                    alignItems: "flex-end",
                  }}
                >
                  {generalLedgerTicks.map((x, i) => {
                    const width =
                      ((mobileView ? windowWidth : windowWidth - 300) - 22) /
                      generalLedgerTicks.length;
                    const height = Object.values(x)[0] / maxHeightDivs;
                    //console.log(maxHeightDivs);
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => {
                          setHoverDiv(Object.keys(x)[0]);
                        }}
                        onMouseLeave={() => {
                          setHoverDiv("");
                        }}
                        onClick={() => setClickDiv(Object.keys(x)[0])}
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            hoverDiv !== Object.keys(x)[0]
                              ? Object.values(x)[0] >= 0
                                ? "green"
                                : "red"
                              : "black",
                          borderTopLeftRadius: "5px",
                          borderTopRightRadius: "5px",
                          width,
                          height: `${
                            Object.values(x)[0] < 0 ? 0 : height * 100
                          }%`,
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
                    display: selection !== "I/S" ? "flex" : "none",
                    height: "28px",
                    alignItems: "flex-start",
                  }}
                >
                  {generalLedgerTicks.map((x, i) => {
                    const width =
                      ((mobileView ? windowWidth : windowWidth - 300) - 22) /
                      generalLedgerTicks.length;
                    const height = Object.values(x)[0] / maxHeightDivs;
                    //console.log(maxHeightDivs);
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => {
                          setHoverDiv(Object.keys(x)[0]);
                        }}
                        onMouseLeave={() => {
                          setHoverDiv("");
                        }}
                        onClick={() => setClickDiv(Object.keys(x)[0])}
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            hoverDiv !== Object.keys(x)[0]
                              ? Object.values(x)[0] >= 0
                                ? "green"
                                : "red"
                              : "black",
                          borderBottomLeftRadius: "5px",
                          borderBottomRightRadius: "5px",
                          width,
                          height: `${
                            Object.values(x)[0] >= 0
                              ? 0
                              : Math.abs(height) * 100
                          }%`,
                          transition: ".2s ease-in",
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>
              <div
                style={{
                  display: selection !== "I/S" ? "flex" : "none",
                  alignItems: "center",
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: "70px",
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                }}
              >
                <label
                  style={{
                    textAlign: "center",
                    marginLeft: "10px",
                    width: "max-content",
                  }}
                >
                  START
                  <br />
                  <input
                    type="date"
                    id="start"
                    name="query-start"
                    value={startingDate}
                    onChange={(e) => {
                      setStartingDate(e.target.value);
                    }}
                    style={{ borderRadius: "6px", width: "max-content" }}
                  />
                </label>
                <label
                  style={{
                    textAlign: "center",
                    marginLeft: "10px",
                    width: "max-content",
                  }}
                >
                  END
                  <br />
                  <input
                    type="date"
                    id="end"
                    name="query-end"
                    value={endingDate}
                    onChange={(e) => {
                      setEndingDate(e.target.value);
                    }}
                    style={{ borderRadius: "6px", width: "max-content" }}
                  />
                </label>
              </div>
              <div ref={tableRef}>
                <span
                  style={{
                    display: selection === "I/S" ? "block" : "none",
                    cursor: "pointer",
                    position: "absolute",
                    marginTop: "10px",
                    right: "10px",
                    padding: "4px",
                    borderRadius: "6px",
                    backgroundColor: "snow",
                  }}
                  onClick={() => {
                    setSelection("General Ledger");
                    window.scrollTo(0, 0);
                  }}
                >
                  see all
                </span>
                <br />
                {selection === "I/S" && false ? (
                  <div
                    style={{
                      padding: "10px 20px",
                      borderTopLeftRadius: "5px",
                      borderTopRightRadius: "5px",
                      margin: "0px 16px",
                      marginTop: "10px",
                      backgroundColor: "white",
                      borderSpacing: 0,
                      tableLayout: "fixed",
                      display: "flex",
                      width: "max-content",
                      position: "relative",
                      fontSize: "20px",
                      fontWeight: "bolder",
                      colSpan: "2",
                    }}
                  >
                    Recent Transactions
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "10px 20px",
                      borderTopLeftRadius: "5px",
                      borderTopRightRadius: "5px",
                      margin: "0px 16px",
                      backgroundColor: "white",
                      borderSpacing: 0,
                      tableLayout: "fixed",
                      display: "flex",
                      width: "max-content",
                      position: "relative",
                      fontSize: "20px",
                      fontWeight: "bolder",
                      colSpan: "2",
                    }}
                  >
                    General Ledger{space}
                    {clickedDiv !== "" || clickedPie !== null ? (
                      <button
                        onClick={() => {
                          setClickDiv("");
                          setClickPie(null);
                        }}
                      >
                        See all.
                      </button>
                    ) : (
                      <span
                        class="fa fa-refresh"
                        style={{
                          cursor: "pointer",
                          height: "min-content",
                          padding: "6px 10px",
                          borderRadius: "10px",
                          color:
                            startingDate &&
                            endingDate &&
                            (startingDate !== lastStartingDate ||
                              endingDate !== lastEndingDate)
                              ? "black"
                              : "grey",
                        }}
                        onClick={() => {
                          if (!startingDate || !endingDate)
                            return window.alert("Invalid queried date.");
                          getGeneralLedger();
                          setSelection("General Ledger");
                        }}
                      ></span>
                    )}
                    <span
                      style={{
                        color: expenseFilterHover ? "grey" : "black",
                        transition: ".3s ease-in",
                        opacity: expenseFilter ? 1 : 0,
                        width: expenseFilter ? "" : 0,
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => {
                        setExpenseFilterHover(true);
                      }}
                      onMouseLeave={() => {
                        setExpenseFilterHover(false);
                      }}
                      onClick={() => {
                        setExpenseFilter(false);
                      }}
                    >
                      <span
                        style={{
                          fontSize: "25px",
                          WebkitTextStroke: "1.5px white",
                          position: "absolute",
                          fontWeight: "bolder",
                          transform: `translate(150%,-20%) rotate(30deg)`,
                        }}
                      >
                        /
                      </span>
                      <span
                        style={{
                          height: "min-content",
                          padding: "6px",
                          paddingRight: "0px",
                          borderRadius: "10px",
                        }}
                        class="fa-solid fa-filter"
                      ></span>
                    </span>
                  </div>
                )}
                <div
                  style={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    height: generalLedgerHeight + 40,
                    width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                  }}
                >
                  <table ref={generalLedgerRef}>
                    <tbody>
                      {generalLedger !== null && generalLedger.length > 0 && (
                        <tr>
                          <td
                            style={{
                              textAlign: "left",
                              backgroundColor: "whitesmoke",
                              color: "grey",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              const gL =
                                upOrder === "upDate"
                                  ? generalLedger.reverse()
                                  : generalLedger.sort(
                                      (a, b) =>
                                        new Date(a.Date) - new Date(b.Date)
                                    );
                              const generalLedger2 = gL.filter((x) => {
                                if (x.Category === "End of month balance")
                                  return false;
                                return true;
                              });
                              setGeneralLedger(generalLedger2);
                              var generalLedgerTicks = [];
                              generalLedger2.forEach((x, i) => {
                                var found = generalLedgerTicks.find(
                                  (y) => y[x.Date.split("T")[0]]
                                );
                                generalLedgerTicks = generalLedgerTicks.filter(
                                  (y) =>
                                    Object.keys(y)[0] !== x.Date.split("T")[0]
                                );
                                generalLedgerTicks.push({
                                  [x.Date.split("T")[0]]:
                                    (found ? Object.values(found)[0] : 0) +
                                    x.Amount,
                                });
                                //console.log(generalLedgerTicks);
                              });
                              setGeneralLedgerTicks(generalLedgerTicks);
                              setUpOrder(upOrder ? false : "upDate");
                            }}
                          >
                            <div>
                              DATE{space}
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
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              backgroundColor: "whitesmoke",
                              color: "grey",
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
                            <div>
                              AMOUNT{space}
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
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              backgroundColor: "whitesmoke",
                              color: "grey",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setGeneralLedger(
                                upOrder === "upCategory"
                                  ? generalLedger.reverse()
                                  : generalLedger.sort(
                                      (a, b) =>
                                        a.Category === null
                                          ? -1
                                          : b.Category === null
                                          ? 1
                                          : b.Category.localeCompare(a.Category) //a.Category < b.Category ? 1 : -1
                                    )
                              );
                              setUpOrder(upOrder ? false : "upCategory");
                            }}
                          >
                            <div>
                              CATEGORY{space}
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
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              backgroundColor: "whitesmoke",
                              color: "grey",
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
                            <div>
                              PLATFORM{space}
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
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              backgroundColor: "whitesmoke",
                              color: "grey",
                              cursor: "pointer",
                            }}
                          >
                            <div>DESCRIPTION</div>
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
                      )}
                      {generalLedger === null ? (
                        <tr>
                          <td></td>
                        </tr>
                      ) : generalLedger.length === 0 ? (
                        <tr>
                          <td>
                            No results{space}
                            <i>for the dates selected</i>.
                          </td>
                        </tr>
                      ) : (
                        generalLedger
                          .map((x, i) =>
                            selection !== "I/S" || i < 10 ? x : null
                          )
                          .filter((x) => {
                            if (x === null) return false;
                            if (expenseFilter && expenseFilter !== x.Category)
                              return false;
                            if (
                              clickedDiv !== "" &&
                              x.Date &&
                              clickedDiv !== x.Date.split("T")[0]
                            )
                              return false;
                            return true;
                          })
                          .map((x, i) => {
                            return (
                              <tr
                                onMouseEnter={() => {
                                  setHoverRow(x.TransactionID);
                                }}
                                onMouseLeave={() => {
                                  setHoverRow(null);
                                }}
                                key={x.TransactionID}
                                style={{
                                  backgroundColor:
                                    x.TransactionID === hoverRow
                                      ? "rgb(240,240,240,.3)"
                                      : x.Date === hoverDiv
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
                                    if (editCategory === x.TransactionID)
                                      return null;
                                    setEditCategory(x.TransactionID);
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {editCategory === x.TransactionID ? (
                                    <form
                                      style={{
                                        display: "flex",
                                      }}
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        setAllowUpdate(true);
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
                                                "https://raifinancial.azurewebsites.net/api/updatecategory",
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    Authorization: `Bearer ${response.idToken}`,
                                                    "Content-Type":
                                                      "application/JSON",
                                                  },
                                                  body: JSON.stringify({
                                                    ...x,
                                                    Category: newCategory,
                                                  }),
                                                }
                                              )
                                                .then(
                                                  async (res) =>
                                                    await res.json()
                                                )
                                                .then((response) => {
                                                  console.log(response);
                                                  if (allowUpdate) {
                                                    setNewCategory("");
                                                    getGeneralLedger();
                                                    setSelection(
                                                      "General Ledger"
                                                    );
                                                    setEditCategory(false);
                                                  }
                                                })
                                                .catch((error) => {
                                                  console.error(error);
                                                });
                                            });
                                        }
                                      }}
                                    >
                                      <div
                                        onClick={() => setEditCategory(false)}
                                      >
                                        &times;
                                      </div>
                                      <input
                                        placeholder={
                                          x.Category ? x.Category : "(empty)"
                                        }
                                        value={newCategory}
                                        onChange={(e) => {
                                          setNewCategory(e.target.value);
                                        }}
                                      />
                                    </form>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setNewCategory("");
                                        setAllowUpdate(false);
                                      }}
                                    >
                                      {x.Category}
                                    </div>
                                  )}
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
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {selection === "Balances" && (
            <div>
              <br />
              <div
                style={{
                  padding: "10px 20px",
                  borderTopLeftRadius: "5px",
                  borderTopRightRadius: "5px",
                  margin: "0px 16px",
                  backgroundColor: "white",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  display: "flex",
                  width: "max-content",
                  position: "relative",
                  fontSize: "20px",
                  fontWeight: "bolder",
                  colSpan: "2",
                }}
              >
                Account Balances{space}
                <span
                  class="fa fa-refresh"
                  style={{
                    cursor: "pointer",
                    height: "min-content",
                    padding: "6px 10px",
                    borderRadius: "10px",
                  }}
                  onClick={() => {
                    getAccountBalances();
                    setSelection("Balances");
                  }}
                ></span>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: accountBalancesHeight + 40,
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                }}
              >
                <table ref={accountBalancesRef}>
                  <tbody>
                    {accountBalances !== null && accountBalances.length > 0 && (
                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>Account</div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>Balance</div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          <div>Last Updated</div>
                        </td>
                      </tr>
                    )}
                    {accountBalances === null ? (
                      ""
                    ) : accountBalances.length === 0 ? (
                      <tr>
                        <td>No results</td>
                      </tr>
                    ) : (
                      accountBalances.map((x, i) => {
                        return (
                          <tr
                            onMouseEnter={() => {
                              setHoverRow(x.AccountName);
                            }}
                            onMouseLeave={() => {
                              setHoverRow(null);
                            }}
                            key={i + x.LastUpdated}
                            style={{
                              backgroundColor:
                                x.AccountName === hoverRow
                                  ? "rgb(240,240,240,.3)"
                                  : "",
                            }}
                          >
                            <td>
                              <div>{x.AccountName}</div>
                            </td>
                            <td>
                              <div>${addCommas(String(x.CurrentBalance))}</div>
                            </td>
                            <td>
                              <div>
                                {new Date(x.LastUpdated).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selection === "Payroll" && (
            <div
              /*onScroll={(e) => {
                if (!mobileView) {
                  setMobileView(e.target.scrollLeft > 300);
                }
              }}*/
              style={{
                alignItems: "flex-start",
                display:
                  true ||
                  windowWidth < 500 ||
                  (windowWidth < 900 && !mobileView)
                    ? "block"
                    : "flex",
              }}
            >
              {(true ||
                windowWidth < 500 ||
                (windowWidth < 900 && !mobileView)) && (
                <div
                  style={{
                    transition: ".3s ease-out",
                    height: payoutLog && payoutLog.length > 0 ? "" : "0px",
                    margin: "20px 60px",
                    width:
                      windowWidth < 500 ? windowWidth - windowWidth / 3 : 300,
                  }}
                >
                  {pieChart()}
                </div>
              )}
              <br />
              <div
                style={{
                  padding: "10px 20px",
                  borderTopLeftRadius: "5px",
                  borderTopRightRadius: "5px",
                  margin: "0px 16px",
                  backgroundColor: "white",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  display: "flex",
                  width: "max-content",
                  position: "relative",
                  fontSize: "20px",
                  fontWeight: "bolder",
                  colSpan: "2",
                }}
              >
                Payroll{space}
                <span
                  class="fa fa-refresh"
                  style={{
                    cursor: "pointer",
                    height: "min-content",
                    padding: "6px 10px",
                    borderRadius: "10px",
                  }}
                  onClick={() => {
                    getPayouLog();
                    setSelection("Payroll");
                  }}
                ></span>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: payrollHeight + 40,
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                }}
              >
                <table ref={payrollRef}>
                  <tbody>
                    {payoutLog !== null && payoutLog.length > 0 && (
                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
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
                          <div>
                            DATE{" "}
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
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setPayoutLog(
                              upOrder === "upEmployee"
                                ? payoutLog.reverse()
                                : payoutLog.sort((a, b) =>
                                    a.EmployeeName === null
                                      ? -1
                                      : b.EmployeeName === null
                                      ? 1
                                      : b.EmployeeName.localeCompare(
                                          a.EmployeeName
                                        )
                                  )
                            );
                            setUpOrder(upOrder ? false : "upEmployee");
                          }}
                        >
                          <div>
                            EMPLOYEE{" "}
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
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
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
                          <div>
                            AMOUNT{" "}
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
                          </div>
                        </td>
                      </tr>
                    )}
                    {payoutLog === null ? (
                      ""
                    ) : payoutLog.length === 0 ? (
                      <tr>
                        <td>No results</td>
                      </tr>
                    ) : (
                      payoutLog.map((x, i) => {
                        return (
                          (clickedPie === null ||
                            x.EmployeeName === clickedPie) && (
                            <tr
                              onMouseEnter={() => {
                                setHoverRow(x.PayoutID);
                              }}
                              onMouseLeave={() => {
                                setHoverRow(null);
                              }}
                              key={i + String(x.PayoutID)}
                              style={{
                                backgroundColor:
                                  x.PayoutID === hoverRow
                                    ? "rgb(240,240,240,.3)"
                                    : "",
                              }}
                            >
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {false &&
                !(windowWidth < 500 || (windowWidth < 900 && !mobileView)) && (
                  <div
                    style={{
                      margin: "20px 60px",
                      minWidth: "300px",
                    }}
                  >
                    {pieChart()}
                  </div>
                )}
            </div>
          )}
          {selection === "Invoices" && (
            <div>
              <br />
              <div
                style={{
                  padding: "10px 20px",
                  borderTopLeftRadius: "5px",
                  borderTopRightRadius: "5px",
                  margin: "0px 16px",
                  backgroundColor: "white",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  display: "flex",
                  width: "max-content",
                  position: "relative",
                  fontSize: "20px",
                  fontWeight: "bolder",
                  colSpan: "2",
                }}
              >
                Invoices{space}
                <span
                  class="fa fa-refresh"
                  style={{
                    cursor: "pointer",
                    height: "min-content",
                    padding: "6px 10px",
                    borderRadius: "10px",
                  }}
                  onClick={() => {
                    getInvoices();
                    setSelection("Invoices");
                  }}
                ></span>
              </div>
              <div
                /*onScroll={(e) => {
                if (!mobileView) {
                  setMobileView(e.target.scrollLeft > 300);
                }
              }}*/
                style={{
                  height: invoicesHeight + 40,
                  alignItems: "flex-start",
                  display: "block",
                  overflowX: "auto",
                  overflowY: "hidden",
                  width: `calc(100vw - ${mobileView ? 0 : 300}px)`,
                }}
              >
                <table ref={invoicesRef}>
                  <tbody>
                    {invoices !== null && invoices.length > 0 && (
                      <tr>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setInvoices(
                              upOrder === "upDate"
                                ? invoices.slice().reverse()
                                : invoices.sort(
                                    (a, b) =>
                                      new Date(a.Date) - new Date(b.Date)
                                  )
                            );
                            setUpOrder(upOrder ? false : "upDate");
                          }}
                        >
                          <div>
                            DATE{" "}
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
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setInvoices(
                              upOrder === "upCategory"
                                ? invoices.reverse()
                                : invoices.sort((a, b) =>
                                    a.Category === null
                                      ? -1
                                      : b.Category === null
                                      ? 1
                                      : b.Category.localeCompare(a.Category)
                                  )
                            );
                            setUpOrder(upOrder ? false : "upCategory");
                          }}
                        >
                          <div>
                            CATEGORY{" "}
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
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setInvoices(
                              upOrder === "upAmount"
                                ? invoices.reverse()
                                : invoices.sort((a, b) =>
                                    a.Amount < b.Amount ? 1 : -1
                                  )
                            );
                            setUpOrder(upOrder ? false : "upAmount");
                          }}
                        >
                          <div>
                            AMOUNT{" "}
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
                          </div>
                        </td>
                      </tr>
                    )}
                    {invoices === null ? (
                      ""
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td>No results</td>
                      </tr>
                    ) : (
                      invoices.map((x, i) => {
                        return (
                          <tr
                            onMouseEnter={() => {
                              setHoverRow(x.InvoiceID);
                            }}
                            onMouseLeave={() => {
                              setHoverRow(null);
                            }}
                            key={String(x.InvoiceID)}
                            style={{
                              backgroundColor:
                                x.InvoiceID === hoverRow
                                  ? "rgb(240,240,240,.3)"
                                  : "",
                            }}
                          >
                            <td>
                              <div>
                                {new Date(x.Date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </td>
                            <td style={{ cursor: "pointer" }}>
                              {editCategory === x.InvoiceID ? (
                                <form
                                  style={{
                                    display: "flex",
                                  }}
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    setAllowUpdate(true);
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
                                            "https://raifinancial.azurewebsites.net/api/updatecategoryinvoices",
                                            {
                                              method: "POST",
                                              headers: {
                                                Authorization: `Bearer ${response.idToken}`,
                                                "Content-Type":
                                                  "application/JSON",
                                              },
                                              body: JSON.stringify({
                                                ...x,
                                                Category: newCategory,
                                              }),
                                            }
                                          )
                                            .then(
                                              async (res) => await res.json()
                                            )
                                            .then((response) => {
                                              console.log(response);
                                              if (allowUpdate) {
                                                setNewCategory("");
                                                getInvoices();
                                                setSelection("Invoices");
                                                setEditCategory(false);
                                              }
                                            })
                                            .catch((error) => {
                                              console.error(error);
                                            });
                                        });
                                    }
                                  }}
                                >
                                  <div onClick={() => setEditCategory(false)}>
                                    &times;
                                  </div>
                                  <input
                                    placeholder={
                                      x.Category ? x.Category : "(empty)"
                                    }
                                    value={newCategory}
                                    onChange={(e) => {
                                      setNewCategory(e.target.value);
                                    }}
                                  />
                                </form>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditCategory(x.InvoiceID);
                                    setNewCategory("");
                                    setAllowUpdate(false);
                                  }}
                                >
                                  {x.Category}
                                </div>
                              )}
                            </td>
                            <td>
                              <div>${addCommas(String(x.Amount))}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {selection !== "" && (
          <div>
            {clickedDiv !== "" || clickedPie !== null ? (
              <button
                onClick={() => {
                  setClickDiv("");
                  setClickPie(null);
                }}
              >
                See all.
              </button>
            ) : (
              "End of results."
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComponent;
