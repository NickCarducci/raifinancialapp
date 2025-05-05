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
            instance.logoutRedirect({
              account: accounts[0],
              mainWindowRedirectUri: window.location.href,
            });
            console.error(error);
          });
      })
      .catch((error) => {
        instance.logoutRedirect({
          account: accounts[0],
          mainWindowRedirectUri: window.location.href,
        });
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
  const [selection, setSelection] = useState("");
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
          instance.logoutRedirect({
            account: accounts[0],
            mainWindowRedirectUri: window.location.href,
          });
          console.error(error);
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
      setMobileView(window.innerWidth < 500 ? true : false);
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
  const [generalLedgerTicks, setGeneralLedgerTicks] = useState([]);
  const getGeneralLedger = () => {
    if (mobileView) setSelectionMenu(false);
    setGeneralLedger([{ Amount: "Connecting to database..." }]);
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
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
                forceRefresh: true,
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
    "orange",
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
          backgroundColor: "green",
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
          backgroundColor: "red",
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
      ? Math.sign(thisMonthsIOStatement.Revenue) === 0 ||
        Math.sign(lastMonthsIOStatement.Revenue) === 0 ||
        Math.sign(thisMonthsIOStatement.Revenue) ===
          Math.sign(lastMonthsIOStatement.Revenue)
        ? (
            ((thisMonthsIOStatement.Revenue - lastMonthsIOStatement.Revenue) /
              lastMonthsIOStatement.Revenue) *
            100
          ).toFixed(2)
        : (
            ((thisMonthsIOStatement.Revenue + lastMonthsIOStatement.Revenue) /
              lastMonthsIOStatement.Revenue) *
            100
          ).toFixed(2)
      : 0;
  const changeInTotalExpenses =
    thisMonthsIOStatement && lastMonthsIOStatement
      ? Math.sign(thisMonthsIOStatement.Expenses) === 0 ||
        Math.sign(lastMonthsIOStatement.Expenses) === 0 ||
        Math.sign(thisMonthsIOStatement.Expenses) ===
          Math.sign(lastMonthsIOStatement.Expenses)
        ? (
            ((thisMonthsIOStatement.Expenses - lastMonthsIOStatement.Expenses) /
              lastMonthsIOStatement.Expenses) *
            100
          ).toFixed(2)
        : (
            ((thisMonthsIOStatement.Expenses + lastMonthsIOStatement.Expenses) /
              lastMonthsIOStatement.Expenses) *
            100
          ).toFixed(2)
      : 0;
  const changeInNetProfit =
    thisMonthsIOStatement && lastMonthsIOStatement
      ? Math.sign(thisMonthsIOStatement.NetProfit) ===
        Math.sign(lastMonthsIOStatement.NetProfit)
        ? (
            ((thisMonthsIOStatement.NetProfit -
              lastMonthsIOStatement.NetProfit) /
              lastMonthsIOStatement.NetProfit) *
            100
          ).toFixed(2)
        : (
            ((Math.abs(thisMonthsIOStatement.NetProfit) +
              Math.abs(lastMonthsIOStatement.NetProfit)) /
              thisMonthsIOStatement.NetProfit) *
            100
          ).toFixed(2)
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
                forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setRevenue([{ Amount: "Sign in again..." }]);
            }
            var revenueByQuarter = [];
            var revenueByYear = [];
            result.revenue.forEach((x) => {
              const found = revenueByQuarter.find(
                (y) => y.Quarter === x.Quarter && y.Category === x.Category
              );
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

              if (!found)
                revenueByQuarter.push({
                  ...x,
                  Quarter: thisQuarter,
                });
              revenueByQuarter = revenueByQuarter.filter(
                (y) => y.Quarter !== thisQuarter || y.Category !== x.Category
              );
              revenueByQuarter.push(
                found
                  ? {
                      ...x,
                    }
                  : {
                      ...x,
                      Quarter: thisQuarter,
                    }
              );
              const found1 = revenueByYear.find(
                (y) => y.Year === x.Year && y.Category === x.Category
              );
              const year = new Date(x.Date).getFullYear();
              if (!found1)
                revenueByYear.push({
                  ...x,
                  Year: year,
                });
              revenueByYear = revenueByYear.filter(
                (y) => y.Year !== year || y.Category !== x.Category
              );
              revenueByYear.push(
                found1
                  ? {
                      ...x,
                      Amount: found1.Amount + x.Amount,
                    }
                  : {
                      ...x,
                      Year: year,
                    }
              );
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
                forceRefresh: true,
                refreshTokenExpirationOffsetSeconds: 7200, // 2 hours * 60 minutes * 60 seconds = 7200 seconds
              });
              return setExpenses([
                { Category: "Sign in again...", Amount: 0, Color: "black" },
              ]);
            }
            var expensesByQuarter = [];
            var expensesByYear = [];
            result.expenses.forEach((x) => {
              const found = expensesByQuarter.find(
                (y) => y.Quarter === x.Quarter && y.Category === x.Category
              );
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

              if (!found)
                expensesByQuarter.push({
                  ...x,
                  Quarter: thisQuarter,
                });
              expensesByQuarter = expensesByQuarter.filter(
                (y) => y.Quarter !== thisQuarter || y.Category !== x.Category
              );
              expensesByQuarter.push(
                found
                  ? {
                      ...x,
                      Amount: found.Amount + x.Amount,
                    }
                  : {
                      ...x,
                      Quarter: thisQuarter,
                    }
              );
              const found1 = expensesByYear.find(
                (y) => y.Year === x.Year && y.Category === x.Category
              );
              const year = new Date(x.Date).getFullYear();
              if (!found1)
                expensesByYear.push({
                  ...x,
                  Year: year,
                });
              expensesByYear = expensesByYear.filter(
                (y) => y.Year !== year || y.Category !== x.Category
              );
              expensesByYear.push(
                found1
                  ? {
                      ...x,
                      Amount: found1.Amount + x.Amount,
                    }
                  : {
                      ...x,
                      Year: year,
                    }
              );
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
  const [needsRelinkList, setNeedsRelinkList] = useState([]);
  const [needsRelink, setNeedsRelink] = useState({ ID: -1 });

  useEffect(() => {
    return () => {};
    ///api/needs_relink?userId=1
    authenticatedUser &&
      fetch("https://raifinancial.azurewebsites.net/api/needsrelinklist")
        .then(async (res) => await res.json())
        .then((result) => {
          if (result.needsRelinkList.length > 0) {
            setNeedsRelinkList(result.needsRelinkList);
          }
        })
        .catch((e) => console.log(e.message));
  }, [authenticatedUser]);
  const [linkToken, setLinkToken] = useState(null);
  useEffect(() => {
    return () => {};
    ///api/create_link_token
    authenticatedUser &&
      fetch("https://raifinancial.azurewebsites.net/api/get_link_token", {
        method: "GET",
      })
        .then(async (res) => await res.json())
        .then((result) => {
          setLinkToken(result.link_token);
        })
        .catch((e) => console.log(e.message));
  }, [authenticatedUser]);
  const config = {
    token: linkToken,
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
          var needsRelinkWithOrWithoutID = needsRelink;
          if (needsRelinkWithOrWithoutID.ID === -1) {
            delete needsRelinkWithOrWithoutID.ID;
          }
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
              setNeedsRelink({ ID: -1 });
            })
            .catch((e) => console.log(e.message));
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
          display: mobileView ? "float" : "block",
          position: "relative",
          fontWeight: "bolder",
          color: "white",
          backgroundColor: "orange",
          borderBottom: mobileView ? "5px solid rgba(0,0,0,.3)" : "",
          borderRight: !mobileView ? "5px solid rgba(0,0,0,.3)" : "",
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
                              { Revenue: "please log in again..." },
                            ]);
                          }
                          setIOMonths(
                            result.ioStatement
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
                          console.log(result.ioStatement);
                          result.ioStatement &&
                            setIOStatement(result.ioStatement);
                          getExpenses();
                        })
                        .catch(() => {
                          setIOStatement([
                            { Revenue: "please log in again..." },
                          ]);
                        });
                    });
                  getGeneralLedger();
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
                              EmployeeName: employeeName
                                ? employeeName.slice(
                                    0,
                                    employeeName.search(/\d/)
                                  )
                                : x.EmployeeName,
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
                                color: `rgb(${getRandomInt(250)},${getRandomInt(
                                  250
                                )},${
                                  getRandomInt(250) //(i / result.payoutLog.length) * 250
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

              <div
                style={{
                  backgroundColor: "yellow",
                  padding: "1em",
                  marginBottom: "1em",
                  display: "none",
                }}
              >
                {needsRelinkList.length > 0 && (
                  <div>
                    ⚠️ Please reconnect the following bank(s):{" "}
                    {needsRelinkList.map((x) => {
                      return (
                        <button
                          onClick={() => {
                            openPlaid();
                            setNeedsRelink(x);
                          }}
                          disabled={!readyPlaid || !linkTokenPlaid}
                        >
                          Reconnect {x.BankName}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => {
                    openPlaid();
                    setNeedsRelink({ ID: -1 });
                  }}
                  disabled={!readyPlaid || !linkTokenPlaid}
                >
                  Connect New Bank Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "snow",
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
            backgroundColor: "whitesmoke",
          }}
        >
          {selection === "I/S" && (
            <div>
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
                              String(new Date().getMonth() + 1).padStart(2, "0")
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
              <div
                style={{
                  width: mobileView ? "100vw" : "calc(100vw - 300px)",
                  overflowX: "auto",
                  overflowY: "hidden",
                  height: "170px",
                }}
              >
                {ioStatement === null ? (
                  ""
                ) : ioStatement.length === 0 ? (
                  "No results"
                ) : (
                  <div style={{ display: "flex" }}>
                    <div
                      onClick={getRevenue}
                      onMouseEnter={() => setIOHover("Revenue")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid orange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        marginLeft: "20px",
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
                        {thisMonthsIOStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.Revenue.toFixed(2)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: "max-content",
                          color: changeInTotalRevenue === 0 ? "grey" : "black",
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
                        %
                      </div>
                    </div>
                    <div
                      onClick={getExpenses}
                      onMouseEnter={() => setIOHover("Expenses")}
                      onMouseLeave={() => setIOHover("")}
                      style={{
                        cursor: "pointer",
                        borderLeft: "4px solid orange",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        marginLeft: "20px",
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
                        {ioStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.Expenses.toFixed(2)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: "max-content",
                          color: changeInTotalExpenses === 0 ? "grey" : "black",
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
                        %
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
                        marginLeft: "20px",
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
                        {ioStatement
                          ? !selectedDate
                            ? ""
                            : addCommas(
                                thisMonthsIOStatement.NetProfit.toFixed(2)
                              )
                          : "-"}
                      </div>
                      <div
                        style={{
                          width: "max-content",
                          color: changeInNetProfit === 0 ? "grey" : "black",
                        }}
                      >
                        {Number(changeInNetProfit) >= 0 ? (
                          <span class="fa fa-arrow-trend-up"></span>
                        ) : (
                          <span class="fa fa-arrow-trend-down"></span>
                        )}
                        {space}
                        {changeInNetProfit === 0 ? "-" : changeInNetProfit}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div
                style={{
                  display:
                    windowWidth < 500 || (windowWidth < 900 && !mobileView)
                      ? "block"
                      : "flex",
                }}
              >
                <div
                  onMouseLeave={() => setIOHover("")}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    width: windowWidth < 500 ? windowWidth - 60 : "400px",
                    padding: "10px",
                  }}
                >
                  <div style={{ paddingBottom: "20px" }}>
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
                <div
                  onMouseLeave={() => setIOHover("")}
                  style={{
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    margin: "20px",
                    marginRight: "0px",
                    textAlign: "left",
                    width: windowWidth < 500 ? windowWidth - 60 : "400px",
                    padding: "10px",
                    display: "block",
                  }}
                >
                  <div>
                    {selectedIO.substring(0, 1).toLocaleUpperCase() +
                      selectedIO.substring(1, selectedIO.length)}
                  </div>
                  <div
                    style={{
                      display: windowWidth < 300 ? "block" : "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
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
                    <div style={{ display: "block" }}>
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
                                    width: "40px",
                                    height: "20px",
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
                                    width: "40px",
                                    height: "20px",
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
              {((selectedIO === "revenue" && showRevenue) ||
                (selectedIO === "expenses" && showExpenses)) && (
                <table>
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
                    {selectedIO.substring(0, 1).toLocaleUpperCase() +
                      selectedIO.substring(1, selectedIO.length)}
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
                          CATEGORY
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            backgroundColor: "whitesmoke",
                            color: "grey",
                            cursor: "pointer",
                          }}
                        >
                          AMOUNT
                        </td>
                      </tr>
                    )}

                    {(selectedIO === "revenue"
                      ? selectedFrequency === "Monthly"
                        ? revenue !== null && revenue.length > 0
                          ? revenue
                          : []
                        : selectedFrequency === "Quarterly"
                        ? revenueByQuarter !== null &&
                          revenueByQuarter.length > 0
                          ? revenueByQuarter
                          : []
                        : selectedFrequency === "Yearly"
                        ? revenueByYear !== null && revenueByYear.length > 0
                          ? revenueByYear
                          : []
                        : []
                      : selectedIO === "expenses"
                      ? selectedFrequency === "Monthly"
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
                        <tr key={i + x.Date}>
                          <td>{x.Category}</td>
                          <td>${addCommas(String(x.Amount))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
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
                  display: generalLedger.length > 0 ? "block" : "none",
                  margin: "10px",
                  border:
                    "2px solid " + (hoverDivs === true ? "black" : "lightgrey"),
                  borderRadius: "10px",
                  transition: ".3s ease-out",
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
                }}
              >
                <span
                  class="fa fa-refresh"
                  style={{
                    marginLeft: "20px",
                    marginRight: "10px",
                    padding: "6px",
                    borderRadius: "10px",
                    border: "1px solid black",
                  }}
                  onClick={() => {
                    getGeneralLedger();
                    setSelection("General Ledger");
                  }}
                ></span>
                {space}starting date:
                <input
                  type="date"
                  id="start"
                  name="query-start"
                  value={startingDate}
                  onChange={(e) => {
                    setStartingDate(e.target.value);
                  }}
                  style={{ marginRight: "10px", borderRadius: "6px" }}
                />
                {space}ending date:
                <input
                  type="date"
                  id="end"
                  name="query-end"
                  value={endingDate}
                  onChange={(e) => {
                    setEndingDate(e.target.value);
                  }}
                  style={{ borderRadius: "6px" }}
                />
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
                <table>
                  {selection === "I/S" && false ? (
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
                      Recent Transactions
                    </caption>
                  ) : (
                    <caption
                      style={{
                        display: "flex",
                        width: "max-content",
                        position: "relative",
                        fontSize: "20px",
                        fontWeight: "bolder",
                        paddingBottom: "14px",
                        colSpan: "2",
                      }}
                    >
                      General Ledger
                    </caption>
                  )}
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
                            setGeneralLedger(gL);
                            const generalLedger = gL.filter((x) => {
                              if (x.Category === "End of month balance")
                                return false;
                              return true;
                            });
                            var generalLedgerTicks = [];
                            generalLedger.forEach((x, i) => {
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
                                : generalLedger.sort((a, b) =>
                                    a.Category < b.Category ? 1 : -1
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
                              key={i + x.Date}
                              style={{
                                backgroundColor:
                                  x.Date === hoverDiv
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
                                        onClick={() => window.location.reload()}
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
                                                  setNewCategory("");
                                                  getGeneralLedger();
                                                  setSelection(
                                                    "General Ledger"
                                                  );
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
                        })
                    )}
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
                  Account Balances
                </caption>
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
                  {accountBalances === null
                    ? ""
                    : accountBalances.length === 0
                    ? "No results"
                    : accountBalances.map((x, i) => {
                        return (
                          <tr key={i + x.LastUpdated}>
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
                      })}
                </tbody>
              </table>
            </div>
          )}
          {selection === "Payroll" && (
            <div
              style={{
                alignItems: "flex-start",
                display:
                  true ||
                  windowWidth < 500 ||
                  (windowWidth < 900 && !mobileView)
                    ? "block"
                    : "flex",
                overflowX: "auto",
                overflowY: "hidden",
                width: mobileView ? "100%" : "calc(100vw - 300px",
              }}
            >
              {(true ||
                windowWidth < 500 ||
                (windowWidth < 900 && !mobileView)) && (
                <div
                  style={{
                    margin: "20px 60px",
                    width: windowWidth - windowWidth / 3,
                  }}
                >
                  {pieChart()}
                </div>
              )}
              <table>
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
                  Payroll
                </caption>
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
                                  a.EmployeeName < b.EmployeeName ? 1 : -1
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
                  {payoutLog === null
                    ? ""
                    : payoutLog.length === 0
                    ? "No results"
                    : payoutLog.map((x, i) => {
                        return (
                          (clickedPie === null ||
                            x.EmployeeName === clickedPie) && (
                            <tr key={i + x.PayoutID}>
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
