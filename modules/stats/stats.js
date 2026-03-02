/**
 * Stats Module — chart rendering
 */

const StatsModule = {
    charts: { training: null, rest: null, weight: null, intensity: null, volume: null },

    init() {
        this.setupToggle();
        this.initCharts();
        this.updateCharts();
    },

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = { training: null, rest: null, weight: null, intensity: null, volume: null };
    },

    setupToggle() {
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleChart(btn.dataset.chart));
        });
    },

    toggleChart(chartType) {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.toggle-btn[data-chart="${chartType}"]`)?.classList.add('active');

        const weightCard = document.getElementById('weightChartCard');
        const trainingCard = document.getElementById('trainingChartCard');
        const restCard = document.getElementById('restChartCard');
        const intensityCard = document.getElementById('intensityCard');
        const volumeCard = document.getElementById('volumeCard');

        [weightCard, trainingCard, restCard, intensityCard, volumeCard].forEach(c => {
            if (c) c.classList.add('hidden');
        });

        if (chartType === 'weight') {
            weightCard?.classList.remove('hidden');
        } else if (chartType === 'calories') {
            trainingCard?.classList.remove('hidden');
            restCard?.classList.remove('hidden');
        } else if (chartType === 'training') {
            intensityCard?.classList.remove('hidden');
            volumeCard?.classList.remove('hidden');
        }
    },

    initCharts() {
        Chart.defaults.color = '#6b7b8d';
        Chart.defaults.borderColor = '#e8ecf0';
        Chart.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        const chartTooltip = {
            backgroundColor: '#fff', titleColor: '#1a2332', bodyColor: '#6b7b8d',
            borderColor: '#e8ecf0', borderWidth: 1, cornerRadius: 8, padding: 10
        };
        const gridOpts = { color: 'rgba(0,0,0,0.04)' };

        // Training day chart
        const trainingCtx = document.getElementById('trainingDayChart')?.getContext('2d');
        if (trainingCtx) {
            this.charts.training = new Chart(trainingCtx, {
                type: 'bar',
                data: { labels: [], datasets: [
                    { label: '蛋白质 (g)', data: [], backgroundColor: 'rgba(46,204,113,0.7)', borderColor: '#2ecc71', borderWidth: 1, borderRadius: 6 },
                    { label: '碳水 (g)', data: [], backgroundColor: 'rgba(243,156,18,0.7)', borderColor: '#f39c12', borderWidth: 1, borderRadius: 6 },
                    { label: '脂肪 (g)', data: [], backgroundColor: 'rgba(231,76,60,0.6)', borderColor: '#e74c3c', borderWidth: 1, borderRadius: 6 }
                ]},
                options: { responsive: true, maintainAspectRatio: true, scales: { x: { grid: gridOpts }, y: { beginAtZero: true, grid: gridOpts } }, plugins: { legend: { position: 'top', labels: { color: '#6b7b8d', usePointStyle: true, pointStyle: 'circle' } }, tooltip: chartTooltip } }
            });
        }

        // Rest day chart
        const restCtx = document.getElementById('restDayChart')?.getContext('2d');
        if (restCtx) {
            this.charts.rest = new Chart(restCtx, {
                type: 'bar',
                data: { labels: [], datasets: [
                    { label: '蛋白质 (g)', data: [], backgroundColor: 'rgba(46,204,113,0.7)', borderColor: '#2ecc71', borderWidth: 1, borderRadius: 6 },
                    { label: '碳水 (g)', data: [], backgroundColor: 'rgba(243,156,18,0.7)', borderColor: '#f39c12', borderWidth: 1, borderRadius: 6 },
                    { label: '脂肪 (g)', data: [], backgroundColor: 'rgba(231,76,60,0.6)', borderColor: '#e74c3c', borderWidth: 1, borderRadius: 6 }
                ]},
                options: { responsive: true, maintainAspectRatio: true, scales: { x: { grid: gridOpts }, y: { beginAtZero: true, grid: gridOpts } }, plugins: { legend: { position: 'top', labels: { color: '#6b7b8d', usePointStyle: true, pointStyle: 'circle' } }, tooltip: chartTooltip } }
            });
        }

        // Weight chart
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        if (weightCtx) {
            this.charts.weight = new Chart(weightCtx, {
                type: 'line',
                data: { labels: [], datasets: [{ label: '体重 (kg)', data: [], fill: true, backgroundColor: 'rgba(0,188,212,0.08)', borderColor: '#00bcd4', borderWidth: 2.5, tension: 0.35, pointBackgroundColor: '#00bcd4', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }] },
                options: { responsive: true, maintainAspectRatio: true, scales: { x: { grid: gridOpts }, y: { beginAtZero: false, grid: gridOpts } }, plugins: { legend: { display: false }, tooltip: chartTooltip } }
            });
        }

        // Training Intensity chart (line chart)
        const intensityCtx = document.getElementById('intensityChart')?.getContext('2d');
        if (intensityCtx) {
            this.charts.intensity = new Chart(intensityCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '最大重量 (kg)',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(231,76,60,0.08)',
                        borderColor: '#e74c3c',
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointBackgroundColor: '#e74c3c',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: { grid: gridOpts, title: { display: true, text: '日期', color: '#6b7b8d', font: { size: 11 } } },
                        y: { beginAtZero: false, grid: gridOpts, title: { display: true, text: '最大重量 (kg)', color: '#e74c3c', font: { size: 11 } } }
                    },
                    plugins: { legend: { display: false }, tooltip: chartTooltip }
                }
            });
        }

        // Training Volume chart (bar chart)
        const volumeCtx = document.getElementById('volumeChart')?.getContext('2d');
        if (volumeCtx) {
            this.charts.volume = new Chart(volumeCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: '训练容量 (kg)',
                        data: [],
                        backgroundColor: 'rgba(155,89,182,0.7)',
                        borderColor: '#9b59b6',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: { grid: gridOpts, title: { display: true, text: '日期', color: '#6b7b8d', font: { size: 11 } } },
                        y: { beginAtZero: true, grid: gridOpts, title: { display: true, text: '训练容量 (kg)', color: '#9b59b6', font: { size: 11 } } }
                    },
                    plugins: { legend: { display: false }, tooltip: chartTooltip }
                }
            });
        }
    },

    async updateCharts() {
        // Training day chart
        if (this.charts.training) {
            const trainingRecords = await Storage.getRecentDietRecords('training', 7);
            this.charts.training.data.labels = trainingRecords.map(r => r.date.slice(5));
            this.charts.training.data.datasets[0].data = trainingRecords.map(r => r.totals.protein);
            this.charts.training.data.datasets[1].data = trainingRecords.map(r => r.totals.carbs);
            this.charts.training.data.datasets[2].data = trainingRecords.map(r => r.totals.fat);
            this.charts.training.update();
        }

        // Rest day chart
        if (this.charts.rest) {
            const restRecords = await Storage.getRecentDietRecords('rest', 7);
            this.charts.rest.data.labels = restRecords.map(r => r.date.slice(5));
            this.charts.rest.data.datasets[0].data = restRecords.map(r => r.totals.protein);
            this.charts.rest.data.datasets[1].data = restRecords.map(r => r.totals.carbs);
            this.charts.rest.data.datasets[2].data = restRecords.map(r => r.totals.fat);
            this.charts.rest.update();
        }

        // Weight chart
        if (this.charts.weight) {
            const weightRecords = await Storage.getRecentWeightRecords(30);
            this.charts.weight.data.labels = weightRecords.map(r => r.date.slice(5));
            this.charts.weight.data.datasets[0].data = weightRecords.map(r => r.weight);
            this.charts.weight.update();

            if (weightRecords.length > 0) {
                const el = document.getElementById('latestWeight');
                if (el) el.textContent = weightRecords[weightRecords.length - 1].weight;
            }
        }

        // Training Intensity chart
        if (this.charts.intensity) {
            const trainingData = await Storage.getRecentTrainingRecords(14);
            this.charts.intensity.data.labels = trainingData.map(r => r.date.slice(5));
            this.charts.intensity.data.datasets[0].data = trainingData.map(r => r.maxIntensity || 0);
            this.charts.intensity.update();
        }

        // Training Volume chart
        if (this.charts.volume) {
            const trainingData2 = await Storage.getRecentTrainingRecords(14);
            this.charts.volume.data.labels = trainingData2.map(r => r.date.slice(5));
            this.charts.volume.data.datasets[0].data = trainingData2.map(r => r.totalVolume || 0);
            this.charts.volume.update();
        }
    }
};

window.StatsModule = StatsModule;
