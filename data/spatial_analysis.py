import json
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.spatial import KDTree
from shapely.geometry import Polygon, MultiPolygon, LineString, Point
from shapely.ops import unary_union
from sklearn.decomposition import PCA

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

class PointDistributionAnalyzer:
    """点状分布测度分析器"""
    
    def __init__(self, points, weights=None):
        """
        初始化
        :param points: 点坐标数组，shape (n, 2)，列顺序为 [经度, 纬度]
        :param weights: 权重数组，用于加权平均中心（如人口权重）
        """
        self.points = np.array(points)
        self.weights = np.array(weights) if weights is not None else None
        self.n = len(points)
    
    def mean_center(self):
        """计算平均中心（Mean Center）"""
        if self.weights is not None:
            # 加权平均中心（人口/经济重心）
            total_weight = np.sum(self.weights)
            mx = np.sum(self.points[:, 0] * self.weights) / total_weight
            my = np.sum(self.points[:, 1] * self.weights) / total_weight
            return (mx, my), "加权平均中心（人口/经济重心）"
        else:
            # 简单平均中心
            mx = np.mean(self.points[:, 0])
            my = np.mean(self.points[:, 1])
            return (mx, my), "平均中心"
    
    def median_center(self):
        """计算中项中心（Median Center）"""
        # 中项中心是使到所有点的曼哈顿距离之和最小的点
        # 对于经纬度数据，使用中位数作为近似
        mx = np.median(self.points[:, 0])
        my = np.median(self.points[:, 1])
        return (mx, my), "中项中心"
    
    def nearest_neighbor_index(self, area):
        """
        计算最近邻指数（Nearest Neighbor Index, NNI）
        :param area: 研究区域面积（平方公里）
        :return: NNI值，<1为聚集分布，=1为随机分布，>1为均匀分布
        """
        # 计算每个点到最近邻点的距离
        tree = KDTree(self.points)
        distances, _ = tree.query(self.points, k=2)  # k=2返回自身和最近邻
        nearest_distances = distances[:, 1]  # 排除自身
        
        # 平均最近邻距离
        observed_mean_distance = np.mean(nearest_distances)
        
        # 期望随机分布的平均最近邻距离
        density = self.n / area
        expected_mean_distance = 1 / (2 * np.sqrt(density))
        
        # NNI = 观测距离 / 期望距离
        nni = observed_mean_distance / expected_mean_distance
        
        return nni, observed_mean_distance, expected_mean_distance
    
    def plot_distribution(self, centers, title="点状分布测度", labels=None):
        """绘制点分布和中心"""
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # 绘制点
        ax.scatter(self.points[:, 0], self.points[:, 1], c='blue', s=50, alpha=0.6, label='点位')
        
        # 绘制中心
        colors = ['red', 'green', 'orange']
        for i, ((cx, cy), name) in enumerate(centers):
            ax.scatter(cx, cy, c=colors[i], s=150, marker='*', label=name)
        
        # 添加标签
        if labels is not None:
            for i, (x, y) in enumerate(self.points):
                ax.text(x + 0.01, y + 0.01, labels[i], fontsize=8)
        
        ax.set_xlabel('经度')
        ax.set_ylabel('纬度')
        ax.set_title(title)
        ax.legend()
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        return fig


class LineDistributionAnalyzer:
    """线状分布测度分析器"""
    
    def __init__(self, lines):
        """
        初始化
        :param lines: LineString对象列表
        """
        self.lines = lines
    
    def total_length(self):
        """计算总长度"""
        return sum(line.length for line in self.lines)
    
    def network_dimension(self):
        """计算网络维度（分形维数近似）"""
        # 方法：使用不同尺度计算长度，拟合 log(length) vs log(scale)
        # 简化版本：使用总长度和覆盖面积的关系
        if not self.lines:
            return 1.0
        
        # 计算网络覆盖的边界框
        all_coords = []
        for line in self.lines:
            coords = list(line.coords)
            all_coords.extend(coords)
        
        coords_array = np.array(all_coords)
        min_x, min_y = coords_array.min(axis=0)
        max_x, max_y = coords_array.max(axis=0)
        
        # 计算覆盖面积（近似）
        width = max_x - min_x
        height = max_y - min_y
        area = width * height
        
        # 计算总长度
        total_len = self.total_length()
        
        # 分形维数 D ≈ log(length) / log(1/scale)
        # 简化：D ≈ log(total_len) / log(max(width, height))
        if area > 0 and total_len > 0:
            scale = max(width, height)
            if scale > 0:
                dimension = np.log(total_len) / np.log(1/scale) if scale < 1 else np.log(total_len) / np.log(scale)
                return min(max(dimension, 1.0), 2.0)  # 限制在1-2之间
        
        return 1.0
    
    def detour_index(self):
        """计算迂回指数（Detour Index）"""
        if len(self.lines) < 2:
            return 1.0
        
        # 创建完整的网络
        merged = unary_union(self.lines)
        
        if isinstance(merged, LineString):
            # 单条线，计算总长度与直线距离的比
            coords = list(merged.coords)
            if len(coords) >= 2:
                start = Point(coords[0])
                end = Point(coords[-1])
                straight_dist = start.distance(end)
                if straight_dist > 0:
                    return merged.length / straight_dist
            return 1.0
        
        # 对于多条线，计算所有线的平均迂回指数
        detour_sum = 0
        count = 0
        
        for line in self.lines:
            coords = list(line.coords)
            if len(coords) >= 2:
                start = Point(coords[0])
                end = Point(coords[-1])
                straight_dist = start.distance(end)
                if straight_dist > 0:
                    detour_sum += line.length / straight_dist
                    count += 1
        
        return detour_sum / count if count > 0 else 1.0
    
    def plot_network(self, title="线状分布网络"):
        """绘制网络结构"""
        fig, ax = plt.subplots(figsize=(12, 10))
        
        for line in self.lines:
            coords = list(line.coords)
            x = [c[0] for c in coords]
            y = [c[1] for c in coords]
            ax.plot(x, y, 'b-', linewidth=1, alpha=0.7)
        
        ax.set_xlabel('经度')
        ax.set_ylabel('纬度')
        ax.set_title(title)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        return fig


class AreaDistributionAnalyzer:
    """面状分布测度分析器"""
    
    def __init__(self, polygon):
        """
        初始化
        :param polygon: Shapely Polygon或MultiPolygon对象
        """
        self.polygon = polygon
        self.area = polygon.area
        self.perimeter = polygon.length
    
    def elongation_ratio(self):
        """计算延伸率（Elongation Ratio）"""
        # 延伸率 = 短轴长度 / 长轴长度
        # 通过PCA计算主轴方向
        coords = np.array(list(self.polygon.exterior.coords)) if hasattr(self.polygon, 'exterior') else self._get_all_coords()
        
        if len(coords) < 3:
            return 1.0
        
        # 中心化
        centroid = np.mean(coords, axis=0)
        coords_centered = coords - centroid
        
        # PCA
        pca = PCA(n_components=2)
        pca.fit(coords_centered)
        
        # 特征值表示方差，与轴长度平方成正比
        eigenvalues = pca.explained_variance_
        if eigenvalues[0] > 0:
            ratio = np.sqrt(eigenvalues[1] / eigenvalues[0])
            return min(max(ratio, 0), 1)
        return 1.0
    
    def _get_all_coords(self):
        """从MultiPolygon获取所有坐标"""
        coords = []
        if isinstance(self.polygon, MultiPolygon):
            for poly in self.polygon.geoms:
                coords.extend(list(poly.exterior.coords))
        return np.array(coords)
    
    def form_ratio(self):
        """计算形态率（Form Ratio）"""
        # 形态率 = 面积 / (最小外接矩形面积)
        if self.area <= 0:
            return 0.0
        
        min_rect = self.polygon.minimum_rotated_rectangle
        rect_area = min_rect.area
        
        return self.area / rect_area if rect_area > 0 else 0.0
    
    def compactness_index(self):
        """计算紧凑指数（Compactness Index）"""
        # 紧凑指数 = 与等面积圆周长的比值
        # CI = P / (2 * sqrt(pi * A))，越接近1越紧凑
        if self.area <= 0:
            return 0.0
        
        ideal_perimeter = 2 * np.sqrt(np.pi * self.area)
        return ideal_perimeter / self.perimeter if self.perimeter > 0 else 0.0
    
    def circularity_ratio(self):
        """计算圆形率（Circularity Ratio）"""
        # 圆形率 = 4 * pi * 面积 / 周长^2，范围0-1，越接近1越接近圆形
        if self.perimeter <= 0:
            return 0.0
        
        return (4 * np.pi * self.area) / (self.perimeter ** 2)
    
    def boyce_clark_shape_index(self):
        """计算Boyce-Clark形状指数"""
        # 从质心向多边形边界作等角度的射线，测量距离变化
        if self.area <= 0:
            return 0.0
        
        centroid = self.polygon.centroid
        cx, cy = centroid.x, centroid.y
        
        # 生成等角度射线（使用36条射线提高精度）
        num_rays = 36
        angles = np.linspace(0, 2 * np.pi, num_rays, endpoint=False)
        
        # 计算每条射线与边界的交点距离
        distances = []
        for angle in angles:
            # 创建射线（从质心向外延伸）
            ray_length = 10.0  # 足够长的射线
            end_x = cx + ray_length * np.cos(angle)
            end_y = cy + ray_length * np.sin(angle)
            ray = LineString([(cx, cy), (end_x, end_y)])
            
            # 求交
            intersection = self.polygon.intersection(ray)
            if not intersection.is_empty:
                if isinstance(intersection, Point):
                    dist = centroid.distance(intersection)
                elif isinstance(intersection, LineString):
                    # 如果交线是线段，取离质心最远的点
                    coords = list(intersection.coords)
                    if coords:
                        dist = max(centroid.distance(Point(p)) for p in coords)
                    else:
                        dist = 0
                elif hasattr(intersection, 'geoms'):
                    # MultiPoint或MultiLineString
                    max_dist = 0
                    for geom in intersection.geoms:
                        if isinstance(geom, Point):
                            d = centroid.distance(geom)
                        elif isinstance(geom, LineString):
                            coords = list(geom.coords)
                            if coords:
                                d = max(centroid.distance(Point(p)) for p in coords)
                            else:
                                d = 0
                        else:
                            d = 0
                        if d > max_dist:
                            max_dist = d
                    dist = max_dist
                else:
                    dist = 0
                distances.append(dist)
        
        if len(distances) < 2:
            return 0.0
        
        distances = np.array(distances)
        mean_dist = np.mean(distances)
        
        # Boyce-Clark指数 = 1/n * sum(|d_i - mean| / mean)
        if mean_dist > 0 and np.std(distances) > 1e-10:
            bc_index = np.sum(np.abs(distances - mean_dist) / mean_dist) / len(distances)
        else:
            bc_index = 0.0
        
        return bc_index
    
    def plot_shape(self, title="面状分布形态"):
        """绘制面状要素"""
        fig, ax = plt.subplots(figsize=(10, 10))
        
        # 绘制多边形
        if isinstance(self.polygon, MultiPolygon):
            for poly in self.polygon.geoms:
                x, y = poly.exterior.xy
                ax.fill(x, y, alpha=0.3, fc='blue', ec='black')
        else:
            x, y = self.polygon.exterior.xy
            ax.fill(x, y, alpha=0.3, fc='blue', ec='black')
        
        # 绘制质心
        centroid = self.polygon.centroid
        ax.scatter(centroid.x, centroid.y, c='red', s=100, marker='*', label='质心')
        
        ax.set_xlabel('经度')
        ax.set_ylabel('纬度')
        ax.set_title(title)
        ax.legend()
        ax.set_aspect('equal')
        plt.tight_layout()
        return fig


def main():
    print("="*60)
    print("空间分布测度实验")
    print("="*60)
    
    # ---------------------- 1. 点状分布测度 ----------------------
    print("\n【1】点状分布测度实验")
    print("-"*40)
    
    # 读取Excel数据
    excel_data = pd.read_excel('计量地理学实验1参考数据-江西.xlsx', sheet_name='赣州18')
    print(f"研究区域：赣州市，共{len(excel_data)}个区县")
    
    # 提取坐标和人口数据
    points = excel_data[['Xlon_wgs84', 'Ylat_wgs84']].values
    population_2020 = excel_data['2020年普查'].values
    labels = excel_data['区县'].values
    
    # 计算赣州市总面积（用于NNI计算）
    total_area = excel_data['面积km2'].sum()
    print(f"赣州市总面积：{total_area:.2f} km²")
    
    # 创建分析器
    point_analyzer = PointDistributionAnalyzer(points, weights=population_2020)
    
    # 计算平均中心（人口重心）
    pop_center, _ = point_analyzer.mean_center()
    print(f"人口重心（加权平均中心）：({pop_center[0]:.6f}, {pop_center[1]:.6f})")
    
    # 计算平均中心（无权重）
    point_analyzer_unweighted = PointDistributionAnalyzer(points)
    mean_center, _ = point_analyzer_unweighted.mean_center()
    print(f"平均中心：({mean_center[0]:.6f}, {mean_center[1]:.6f})")
    
    # 计算中项中心
    median_center, _ = point_analyzer_unweighted.median_center()
    print(f"中项中心：({median_center[0]:.6f}, {median_center[1]:.6f})")
    
    # 计算最近邻指数
    nni, observed_dist, expected_dist = point_analyzer_unweighted.nearest_neighbor_index(total_area)
    print(f"最近邻指数（NNI）：{nni:.4f}")
    print(f"  - 观测平均最近邻距离：{observed_dist:.4f}")
    print(f"  - 期望随机分布距离：{expected_dist:.4f}")
    if nni < 1:
        print("  - 分布模式：聚集分布")
    elif nni == 1:
        print("  - 分布模式：随机分布")
    else:
        print("  - 分布模式：均匀分布")
    
    # 绘制点状分布图
    centers = [(mean_center, '平均中心'), (median_center, '中项中心'), (pop_center, '人口重心')]
    fig1 = point_analyzer_unweighted.plot_distribution(centers, "赣州市区县分布与中心测度", labels)
    fig1.savefig('点状分布测度_赣州区县.png', dpi=150, bbox_inches='tight')
    print("\n点状分布测度图已保存：点状分布测度_赣州区县.png")
    
    # ---------------------- 2. 线状分布测度 ----------------------
    print("\n【2】线状分布测度实验")
    print("-"*40)
    
    # 读取道路数据
    with open('road.geojson', 'r', encoding='utf-8') as f:
        road_data = json.load(f)
    
    # 提取LineString对象
    lines = []
    total_length_km = 0
    for feature in road_data['features']:
        geom = feature['geometry']
        if geom['type'] == 'LineString':
            coords = geom['coordinates']
            line = LineString(coords)
            lines.append(line)
            total_length_km += feature['properties'].get('length_km', 0)
    
    print(f"道路数量：{len(lines)} 条")
    print(f"道路总长度：{total_length_km:.2f} km")
    
    # 创建分析器
    line_analyzer = LineDistributionAnalyzer(lines)
    
    # 计算网络维度
    dimension = line_analyzer.network_dimension()
    print(f"网络维度（分形维数）：{dimension:.4f}")
    
    # 计算迂回指数
    detour = line_analyzer.detour_index()
    print(f"迂回指数：{detour:.4f}")
    print(f"  - 说明：迂回指数越接近1，道路越直")
    
    # 绘制网络图
    fig2 = line_analyzer.plot_network("章贡区道路网络分布")
    fig2.savefig('线状分布测度_章贡区道路.png', dpi=150, bbox_inches='tight')
    print("\n线状分布测度图已保存：线状分布测度_章贡区道路.png")
    
    # ---------------------- 3. 面状分布测度 ----------------------
    print("\n【3】面状分布测度实验")
    print("-"*40)
    
    # 读取行政区划数据
    with open('章贡区.geojson', 'r', encoding='utf-8') as f:
        area_data = json.load(f)
    
    # 创建结果DataFrame
    results = []
    
    for feature in area_data['features']:
        name = feature['properties']['name']
        geom = feature['geometry']
        
        # 创建Polygon对象
        if geom['type'] == 'Polygon':
            polygon = Polygon(geom['coordinates'][0])
        elif geom['type'] == 'MultiPolygon':
            polygons = [Polygon(coords[0]) for coords in geom['coordinates']]
            polygon = MultiPolygon(polygons)
        else:
            continue
        
        # 创建分析器
        area_analyzer = AreaDistributionAnalyzer(polygon)
        
        # 计算各项指标
        elongation = area_analyzer.elongation_ratio()
        form = area_analyzer.form_ratio()
        compactness = area_analyzer.compactness_index()
        circularity = area_analyzer.circularity_ratio()
        bc_index = area_analyzer.boyce_clark_shape_index()
        
        results.append({
            '名称': name,
            '面积': polygon.area,
            '周长': polygon.length,
            '延伸率': elongation,
            '形态率': form,
            '紧凑指数': compactness,
            '圆形率': circularity,
            'Boyce-Clark指数': bc_index
        })
        
        # 打印单个区域的结果
        print(f"\n{name}：")
        print(f"  - 面积：{polygon.area:.6f}")
        print(f"  - 周长：{polygon.length:.6f}")
        print(f"  - 延伸率：{elongation:.4f}")
        print(f"  - 形态率：{form:.4f}")
        print(f"  - 紧凑指数：{compactness:.4f}")
        print(f"  - 圆形率：{circularity:.4f}")
        print(f"  - Boyce-Clark指数：{bc_index:.4f}" if not np.isnan(bc_index) else "  - Boyce-Clark指数：N/A")
    
    # 保存结果表格
    results_df = pd.DataFrame(results)
    results_df.to_excel('面状分布测度结果.xlsx', index=False)
    print("\n面状分布测度结果已保存：面状分布测度结果.xlsx")
    
    # 绘制章贡区整体形态
    all_polygons = []
    for feature in area_data['features']:
        geom = feature['geometry']
        if geom['type'] == 'Polygon':
            all_polygons.append(Polygon(geom['coordinates'][0]))
        elif geom['type'] == 'MultiPolygon':
            for coords in geom['coordinates']:
                all_polygons.append(Polygon(coords[0]))
    
    merged_polygon = unary_union(all_polygons)
    area_analyzer_total = AreaDistributionAnalyzer(merged_polygon)
    fig3 = area_analyzer_total.plot_shape("章贡区行政区划分布图")
    fig3.savefig('面状分布测度_章贡区行政区划.png', dpi=150, bbox_inches='tight')
    print("面状分布测度图已保存：面状分布测度_章贡区行政区划.png")
    
    print("\n" + "="*60)
    print("实验完成！")
    print("="*60)


if __name__ == '__main__':
    main()
