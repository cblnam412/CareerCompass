import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../component/Card/Card';
import { Library, FileText, Users, GraduationCap, FileQuestionMark , AlertCircle, School } from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../../context/AuthContext';
import API from '../../API/API';
import styles from './AdminDashboard.module.css';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalUniversities: 0,
    totalUniReps: 0,
    totalSubjects: 0,
    totalSubjectCombinations: 0,
    totalMockExams: 0
  });
  const [testResultsData, setTestResultsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch(`${API}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStatsData(data.stats);
      setTestResultsData(data.testResultsData);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Users, label: "Tổng người dùng", count: statsData.totalUsers },
    { icon: School, label: "Trường đại học", count: statsData.totalUniversities },
    { icon: Users, label: "Đại diện trường đại học", count: statsData.totalUniReps },
    { icon: GraduationCap, label: "Môn học", count: statsData.totalSubjects },
    { icon: Library, label: "Tổ hợp môn", count: statsData.totalSubjectCombinations },
    { icon: FileText, label: "Đề thi", count: statsData.totalMockExams },
    { icon: FileQuestionMark, label: "Câu hỏi", count: statsData.totalQuestions }, 
    { icon: AlertCircle, label: "Báo cáo vi phạm", count: 2 },
  ];

  const violationData = [
    { id: 0, value: 15, label: 'Đang chờ' },
    { id: 1, value: 8, label: 'Từ chối' },
    { id: 2, value: 12, label: 'Chấp thuận' },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Dashboard quản trị viên</h1>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard quản trị viên</h1>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className={styles.statCard}
              role="button"
              tabIndex={0}
            >
              <Card>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{stat.label}</h3>
                  <Icon className={styles.cardIcon} />
                </div>
                <CardContent>
                  <div className={styles.statCount}>{stat.count}</div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Kết quả kiểm tra theo điểm</h3>
          </div>
          <CardContent>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: testResultsData.map(d => d.point.toString()),
                label: 'Điểm'
              }]}
              series={[{ 
                data: testResultsData.map(d => d.count),
                label: 'Số lượng',
                color: '#2196F3'
              }]}
              height={300}
            />
          </CardContent>
        </Card>

        {/* <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Trạng thái báo cáo vi phạm</h3>
          </div>
          <CardContent>
            <PieChart
              series={[{
                data: violationData,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                valueFormatter: (value) => `${value}`,
              }]}
              colors={['#3B82F6', '#E11D48', '#4CAF50']}
              height={300}
            />
          </CardContent>
        </Card> */}
      </div>

      {/* <Card className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Thông tin hệ thống</h3>
        </div>
        <CardContent>
          <p className={styles.infoText}>Chào mừng bạn đến với bảng điều khiển quản trị viên.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}