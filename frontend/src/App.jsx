import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./layout/SidebarLayout/SidebarLayout";
import { useAuth } from "../src/context/AuthContext";
import { LoadingSpinner } from "./component/LoadingSpinner/LoadingSpinner";
import {
  MessageScreen,
  ForumScreen,
  ProfileScreen,
  UniversityTestScreen,
  CareerQuizScreen,
  TestTakingScreen,
  MBTIQuizScreen,
  HollandQuizScreen,
  SearchScreen,
  ManageRepresentativeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  AdminDashboard,
  ManageTestScreen,
  ManageCombinationScreen,
  ManageQuizScreen,
  ManageSoftSkillScreen,
  ManageUserScreen,
  ManageSubjectScreen,
  ManageUniversityScreen,
  CareerPredictionScreen,
  ManageReportScreen,
  ExploreUniversityScreen,
  V_ActScreen,
  MajorComparisonScreen,
  AdmissionTimelineScreen,
  CostEstimationScreen,
} from "./screens";

function App() {
  const { userInfo, accessToken, isFetchingAuth } = useAuth();

  if (isFetchingAuth) {
      return <LoadingSpinner label="Đang lấy thông tin đăng nhập" overlay />;
  }

  const isAdmin = userInfo?.role === "admin";
  const isManager = userInfo?.role === "uniManager";

  const homeRoute = (!accessToken) ? "/" : (isAdmin ? "/admin" : "/user");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={accessToken ? <Navigate to={homeRoute} /> : <LoginScreen />} />
        <Route path="/login" element={accessToken ? <Navigate to={homeRoute} /> : <LoginScreen />} />
        <Route path="/register" element={accessToken ? <Navigate to={homeRoute} /> : <RegisterScreen />} />
        <Route path="/forgot-password" element={accessToken ? <Navigate to={homeRoute} /> : <ForgotPasswordScreen />} />

        <Route path="/user" element={accessToken ? <Sidebar /> : <Navigate to ="/login" />}>
          <Route index element={<ForumScreen />} />
          <Route path="search" element={<SearchScreen />} />
          <Route path="messages" element={<MessageScreen />} />
          <Route path="tests" element={<UniversityTestScreen />} />
          <Route path="tests/:id" element={<TestTakingScreen />} />
          <Route path="quiz" element={<CareerQuizScreen />} />
          <Route path="quiz/mbti" element={<MBTIQuizScreen />} />
          <Route path="quiz/holland" element={<HollandQuizScreen />} />
          <Route path="predict" element={<CareerPredictionScreen />} />
          <Route path="explore-university" element={<ExploreUniversityScreen />} />
          <Route path="major-comparison" element={<MajorComparisonScreen />} />
          <Route path="admission-timeline" element={<AdmissionTimelineScreen />} />
          <Route path="university-cost-estimation" element={<CostEstimationScreen />} />
          <Route path="v-act" element={<V_ActScreen />} />

          <Route path="profile" element={<ProfileScreen />} />
          <Route path="profile/:userId" element={<ProfileScreen />} />
          
          <Route path="representatives" element={isManager ? <ManageRepresentativeScreen /> : <Navigate to={homeRoute} />} />
        </Route>

        <Route path="/admin" element={accessToken ? <Sidebar /> : <Navigate to ="/login" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tests" element={<ManageTestScreen/> } />
          <Route path="combinations" element={<ManageCombinationScreen />} />
          <Route path="quiz" element={<ManageQuizScreen />} />
          <Route path="soft-skills" element={<ManageSoftSkillScreen />} />
          <Route path="users" element={<ManageUserScreen />} />
          <Route path="subjects" element={<ManageSubjectScreen />} />
          <Route path="universities" element={<ManageUniversityScreen />} />
          <Route path="report" element={<ManageReportScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
